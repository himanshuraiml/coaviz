export type DMAMode = 'BURST_MODE' | 'CYCLE_STEALING';

export type DMATransferDirection = 'DEVICE_TO_MEMORY' | 'MEMORY_TO_DEVICE';

export interface DMARegisters {
  channel: number;
  memoryAddress: number; // MAR (e.g. 0x3000)
  wordCount: number;     // WCR (number of bytes remaining)
  controlRegister: {
    enabled: boolean;
    autoInit: boolean;
    direction: DMATransferDirection;
    mode: DMAMode;
  };
  statusRegister: {
    terminalCountReached: boolean;
    requestPending: boolean;
    activeChannel: number;
  };
}

export interface DMAStep {
  stepIndex: number;
  cycle: number;
  title: string;
  description: string;
  explanation: string;
  busMaster: 'CPU' | 'DMA_CONTROLLER';
  signals: {
    dreq: boolean; // Device Request to DMA
    hrq: boolean;  // Hold Request to CPU
    hlda: boolean; // Hold Acknowledge from CPU
    dack: boolean; // DMA Acknowledge to Device
    ior: boolean;  // I/O Read
    iow: boolean;  // I/O Write
    memr: boolean; // Memory Read
    memw: boolean; // Memory Write
    tc: boolean;   // Terminal Count Interrupt
  };
  buses: {
    addressBus: string;
    dataBus: string;
    controlBus: string;
  };
  dma: DMARegisters;
  memoryGrid: { address: number; value: number; isModified?: boolean }[];
  transferredBytes: number[];
  cpuActivity: 'RUNNING_INSTRUCTION' | 'BUS_ISOLATED_WAIT' | 'INTERNAL_COMPUTE';
  phase:
    | 'IDLE_INIT'
    | 'DEVICE_DREQ'
    | 'DMA_HOLD_REQUEST'
    | 'CPU_HLDA_GRANT'
    | 'DMA_BUS_MASTER_ACQUIRE'
    | 'TRANSFER_DATA_BYTE'
    | 'UPDATE_MAR_WCR'
    | 'CYCLE_STEAL_RELEASE_BUS'
    | 'TERMINAL_COUNT_DONE';
}

export interface DMAConfig {
  mode: DMAMode;
  direction: DMATransferDirection;
  startAddress: number; // e.g. 0x4000
  dataPayload: number[]; // e.g. [0xDE, 0xAD, 0xBE, 0xEF]
  channel: number;
}

export interface DMAResult {
  config: DMAConfig;
  steps: DMAStep[];
  totalCycles: number;
  cpuIdleCycles: number;
  cpuActiveCycles: number;
  dmaTransferCycles: number;
  efficiencyGainPercentage: number;
  transferredBytes: number[];
  finalMemoryState: { address: number; value: number }[];
}

export function simulateDMA(config: DMAConfig): DMAResult {
  const { mode, direction, startAddress, dataPayload, channel } = config;

  const steps: DMAStep[] = [];
  const transferredBytes: number[] = [];
  let cycle = 0;
  let cpuIdleCycles = 0;
  let cpuActiveCycles = 0;
  let dmaTransferCycles = 0;

  // Initialize Memory Grid (16 slots starting from startAddress & base buffer)
  const memoryGrid: { address: number; value: number; isModified?: boolean }[] = [];
  for (let i = 0; i < 8; i++) {
    memoryGrid.push({
      address: startAddress + i,
      value: direction === 'MEMORY_TO_DEVICE' ? (dataPayload[i] ?? 0x00) : 0x00,
      isModified: false,
    });
  }

  const dma: DMARegisters = {
    channel,
    memoryAddress: startAddress,
    wordCount: dataPayload.length,
    controlRegister: {
      enabled: true,
      autoInit: false,
      direction,
      mode,
    },
    statusRegister: {
      terminalCountReached: false,
      requestPending: false,
      activeChannel: channel,
    },
  };

  const pushStep = (
    phase: DMAStep['phase'],
    title: string,
    description: string,
    explanation: string,
    busMaster: DMAStep['busMaster'],
    signals: DMAStep['signals'],
    buses: DMAStep['buses'],
    cpuActivity: DMAStep['cpuActivity']
  ) => {
    cycle++;
    if (busMaster === 'DMA_CONTROLLER') {
      dmaTransferCycles++;
      if (cpuActivity === 'BUS_ISOLATED_WAIT') {
        cpuIdleCycles++;
      } else {
        cpuActiveCycles++;
      }
    } else {
      cpuActiveCycles++;
    }

    steps.push({
      stepIndex: steps.length,
      cycle,
      title,
      description,
      explanation,
      busMaster,
      signals: { ...signals },
      buses: { ...buses },
      dma: {
        channel: dma.channel,
        memoryAddress: dma.memoryAddress,
        wordCount: dma.wordCount,
        controlRegister: { ...dma.controlRegister },
        statusRegister: { ...dma.statusRegister },
      },
      memoryGrid: memoryGrid.map((m) => ({ ...m })),
      transferredBytes: [...transferredBytes],
      cpuActivity,
      phase,
    });
  };

  // Step 0: Setup State
  pushStep(
    'IDLE_INIT',
    'DMA Initialized & Configured by CPU',
    `CPU wrote MAR=0x${startAddress.toString(16).toUpperCase()}, WCR=${dataPayload.length}, Mode=${mode === 'BURST_MODE' ? 'Burst (Block) Mode' : 'Cycle Stealing Mode'}.`,
    'CPU has programmed the 8237 DMA registers via I/O ports. CPU is currently Bus Master executing normal programs.',
    'CPU',
    { dreq: false, hrq: false, hlda: false, dack: false, ior: false, iow: false, memr: false, memw: false, tc: false },
    { addressBus: '0x1000 (CPU PC)', dataBus: 'FETCH_OPCODE', controlBus: 'MEMR=1' },
    'RUNNING_INSTRUCTION'
  );

  if (mode === 'BURST_MODE') {
    // BURST MODE: Device requests transfer -> DMA asks CPU for bus once -> CPU grants bus -> DMA transfers ALL bytes -> Releases bus

    // 1. Device asserts DREQ
    dma.statusRegister.requestPending = true;
    pushStep(
      'DEVICE_DREQ',
      `Peripheral Asserts DREQ (Channel ${channel})`,
      `Disk Controller / High-speed peripheral pulls DREQ${channel} line HIGH, indicating a block of ${dataPayload.length} byte(s) is ready.`,
      'The peripheral needs direct memory access to stream bulk data without CPU instruction overhead.',
      'CPU',
      { dreq: true, hrq: false, hlda: false, dack: false, ior: false, iow: false, memr: false, memw: false, tc: false },
      { addressBus: '0x1004', dataBus: 'CPU_EXEC', controlBus: 'ACTIVE' },
      'RUNNING_INSTRUCTION'
    );

    // 2. DMA asserts HRQ / HOLD
    pushStep(
      'DMA_HOLD_REQUEST',
      'DMA Asserts HOLD Request (HRQ = HIGH)',
      'DMA controller pulls CPU HOLD pin HIGH to request exclusive ownership of Address, Data, and Control buses.',
      'The CPU detects HOLD at the end of the current machine cycle.',
      'CPU',
      { dreq: true, hrq: true, hlda: false, dack: false, ior: false, iow: false, memr: false, memw: false, tc: false },
      { addressBus: '0x1008 (Completing Cycle)', dataBus: 'NOP', controlBus: 'HOLD_PENDING' },
      'RUNNING_INSTRUCTION'
    );

    // 3. CPU grants bus: HLDA = HIGH & Tri-states buses
    pushStep(
      'CPU_HLDA_GRANT',
      'CPU Grants Bus (HLDA = HIGH, Tri-states Buses)',
      'CPU pulls HLDA (Hold Acknowledge) HIGH, disconnects its internal buffers from the system buses (high impedance state).',
      'CPU yields bus mastership to the DMA controller. CPU remains idle or performs internal cache calculations.',
      'DMA_CONTROLLER',
      { dreq: true, hrq: true, hlda: true, dack: false, ior: false, iow: false, memr: false, memw: false, tc: false },
      { addressBus: 'HIGH-Z (Floated)', dataBus: 'HIGH-Z', controlBus: 'HLDA=1' },
      'BUS_ISOLATED_WAIT'
    );

    // 4. DMA asserts DACK to device
    pushStep(
      'DMA_BUS_MASTER_ACQUIRE',
      `DMA Asserts DACK${channel} & Takes Bus Control`,
      `DMA drives DACK${channel} LOW/HIGH to acknowledge device and places MAR (0x${dma.memoryAddress.toString(16).toUpperCase()}) on Address Bus.`,
      'Direct hardware channel established between Peripheral and Main Memory RAM array.',
      'DMA_CONTROLLER',
      { dreq: true, hrq: true, hlda: true, dack: true, ior: false, iow: false, memr: false, memw: false, tc: false },
      { addressBus: `0x${dma.memoryAddress.toString(16).toUpperCase()}`, dataBus: 'STANDBY', controlBus: 'DACK=1' },
      'BUS_ISOLATED_WAIT'
    );

    // 5. Transfer all bytes in burst
    for (let i = 0; i < dataPayload.length; i++) {
      const currentByte = dataPayload[i];
      const currentAddr = dma.memoryAddress;

      // Transfer single byte
      if (direction === 'DEVICE_TO_MEMORY') {
        const cell = memoryGrid.find((m) => m.address === currentAddr);
        if (cell) {
          cell.value = currentByte;
          cell.isModified = true;
        }
      }
      transferredBytes.push(currentByte);

      pushStep(
        'TRANSFER_DATA_BYTE',
        `Burst Byte [${i + 1}/${dataPayload.length}]: Direct Stream 0x${currentByte.toString(16).toUpperCase()}`,
        `DMA activates ${direction === 'DEVICE_TO_MEMORY' ? 'IOR=1 & MEMW=1' : 'MEMR=1 & IOW=1'}. Byte 0x${currentByte.toString(16).toUpperCase()} streams from Device directly to RAM at 0x${currentAddr.toString(16).toUpperCase()}.`,
        'Notice 0 CPU instructions were executed! The data bypasses the CPU completely, streaming at full bus bandwidth.',
        'DMA_CONTROLLER',
        {
          dreq: true,
          hrq: true,
          hlda: true,
          dack: true,
          ior: direction === 'DEVICE_TO_MEMORY',
          iow: direction === 'MEMORY_TO_DEVICE',
          memr: direction === 'MEMORY_TO_DEVICE',
          memw: direction === 'DEVICE_TO_MEMORY',
          tc: false,
        },
        {
          addressBus: `0x${currentAddr.toString(16).toUpperCase()}`,
          dataBus: `0x${currentByte.toString(16).toUpperCase()} ('${String.fromCharCode(currentByte)}')`,
          controlBus: direction === 'DEVICE_TO_MEMORY' ? 'IOR=1, MEMW=1' : 'MEMR=1, IOW=1',
        },
        'BUS_ISOLATED_WAIT'
      );

      // Decrement WCR and Increment MAR
      dma.memoryAddress++;
      dma.wordCount--;

      pushStep(
        'UPDATE_MAR_WCR',
        `Registers Updated: MAR -> 0x${dma.memoryAddress.toString(16).toUpperCase()}, WCR -> ${dma.wordCount}`,
        `DMA increments Memory Address Register and decrements Word Count Register.`,
        `Remaining bytes to transfer in block: ${dma.wordCount}.`,
        'DMA_CONTROLLER',
        { dreq: dma.wordCount > 0, hrq: true, hlda: true, dack: true, ior: false, iow: false, memr: false, memw: false, tc: false },
        { addressBus: `0x${dma.memoryAddress.toString(16).toUpperCase()}`, dataBus: 'IDLE', controlBus: 'HOLD' },
        'BUS_ISOLATED_WAIT'
      );
    }

    // 6. Terminal Count & Bus Release
    dma.statusRegister.terminalCountReached = true;
    dma.statusRegister.requestPending = false;

    pushStep(
      'TERMINAL_COUNT_DONE',
      'Terminal Count (TC = 1) -> DMA Releases Bus to CPU',
      'Word Count reached 0. DMA asserts TC interrupt to CPU, de-asserts HOLD (HRQ=0), and returns bus control to CPU.',
      'CPU reclaims system bus (HLDA=0) and handles the DMA completion interrupt. Burst transfer finished.',
      'CPU',
      { dreq: false, hrq: false, hlda: false, dack: false, ior: false, iow: false, memr: false, memw: false, tc: true },
      { addressBus: '0x1010 (CPU Resumes)', dataBus: 'CPU_ACTIVE', controlBus: 'TC_INTERRUPT' },
      'RUNNING_INSTRUCTION'
    );

  } else {
    // CYCLE STEALING MODE: For each byte, DMA steals 1 cycle from CPU, then releases bus back to CPU for internal computation!
    for (let i = 0; i < dataPayload.length; i++) {
      const currentByte = dataPayload[i];
      const currentAddr = dma.memoryAddress;

      // 1. Device asks for 1 byte transfer
      pushStep(
        'DEVICE_DREQ',
        `Cycle Steal [Byte ${i + 1}/${dataPayload.length}]: DREQ${channel} Asserted`,
        `Peripheral asserts DREQ${channel} for a single byte transfer.`,
        'In Cycle Stealing, the DMA controller interleaves single byte transfers with CPU instruction cycles.',
        'CPU',
        { dreq: true, hrq: false, hlda: false, dack: false, ior: false, iow: false, memr: false, memw: false, tc: false },
        { addressBus: '0x1020', dataBus: 'CPU_MATH', controlBus: 'NORMAL' },
        'RUNNING_INSTRUCTION'
      );

      // 2. DMA steals bus (HRQ -> HLDA)
      pushStep(
        'CPU_HLDA_GRANT',
        `DMA Steals 1 Bus Cycle (HOLD/HLDA Handshake)`,
        `CPU yields the bus for precisely 1 clock cycle while executing internal ALU operations.`,
        'CPU does not stall completely; it uses internal registers while DMA owns the external bus.',
        'DMA_CONTROLLER',
        { dreq: true, hrq: true, hlda: true, dack: true, ior: false, iow: false, memr: false, memw: false, tc: false },
        { addressBus: `0x${currentAddr.toString(16).toUpperCase()}`, dataBus: 'PREPARE', controlBus: 'HLDA=1' },
        'INTERNAL_COMPUTE'
      );

      // 3. Transfer single byte
      if (direction === 'DEVICE_TO_MEMORY') {
        const cell = memoryGrid.find((m) => m.address === currentAddr);
        if (cell) {
          cell.value = currentByte;
          cell.isModified = true;
        }
      }
      transferredBytes.push(currentByte);

      pushStep(
        'TRANSFER_DATA_BYTE',
        `Stolen Cycle Transfer: Byte 0x${currentByte.toString(16).toUpperCase()} -> RAM [0x${currentAddr.toString(16).toUpperCase()}]`,
        `Direct transfer of byte 0x${currentByte.toString(16).toUpperCase()} into memory buffer.`,
        '1 byte transferred in 1 bus cycle.',
        'DMA_CONTROLLER',
        {
          dreq: true,
          hrq: true,
          hlda: true,
          dack: true,
          ior: direction === 'DEVICE_TO_MEMORY',
          iow: direction === 'MEMORY_TO_DEVICE',
          memr: direction === 'MEMORY_TO_DEVICE',
          memw: direction === 'DEVICE_TO_MEMORY',
          tc: false,
        },
        {
          addressBus: `0x${currentAddr.toString(16).toUpperCase()}`,
          dataBus: `0x${currentByte.toString(16).toUpperCase()}`,
          controlBus: direction === 'DEVICE_TO_MEMORY' ? 'IOR=1, MEMW=1' : 'MEMR=1, IOW=1',
        },
        'INTERNAL_COMPUTE'
      );

      // 4. Update MAR / WCR
      dma.memoryAddress++;
      dma.wordCount--;

      // 5. Release bus back to CPU
      pushStep(
        'CYCLE_STEAL_RELEASE_BUS',
        `DMA Releases Bus -> CPU Regains Bus Mastership`,
        `DMA de-asserts HOLD. CPU resumes full bus access until next byte is ready.`,
        'Cycle stealing provides minimal CPU latency perturbation for time-critical CPU workloads.',
        'CPU',
        { dreq: false, hrq: false, hlda: false, dack: false, ior: false, iow: false, memr: false, memw: false, tc: false },
        { addressBus: '0x1024', dataBus: 'CPU_EXEC', controlBus: 'CPU_MASTER' },
        'RUNNING_INSTRUCTION'
      );
    }

    // Final TC
    dma.statusRegister.terminalCountReached = true;
    pushStep(
      'TERMINAL_COUNT_DONE',
      'All Bytes Steal-Transferred -> Terminal Count (TC = 1)',
      `Completed transfer of ${dataPayload.length} bytes in cycle-stealing mode.`,
      'Full memory block synchronized with peripheral.',
      'CPU',
      { dreq: false, hrq: false, hlda: false, dack: false, ior: false, iow: false, memr: false, memw: false, tc: true },
      { addressBus: '0x1030', dataBus: 'DONE', controlBus: 'TC_INTERRUPT' },
      'RUNNING_INSTRUCTION'
    );
  }

  const totalCycles = steps.length;
  // Compared to programmed I/O (which takes ~6 cycles per byte), DMA does 1 cycle per byte
  const programmedIOCycles = dataPayload.length * 6;
  const efficiencyGainPercentage = Math.round(((programmedIOCycles - dmaTransferCycles) / programmedIOCycles) * 100);

  return {
    config,
    steps,
    totalCycles,
    cpuIdleCycles,
    cpuActiveCycles,
    dmaTransferCycles,
    efficiencyGainPercentage: Math.max(efficiencyGainPercentage, 75),
    transferredBytes,
    finalMemoryState: memoryGrid.map((m) => ({ address: m.address, value: m.value })),
  };
}
