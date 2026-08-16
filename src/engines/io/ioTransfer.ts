export type IOMode = 'PROGRAMMED_IO' | 'INTERRUPT_DRIVEN';

export type PeripheralDeviceType = 'KEYBOARD' | 'TEMP_SENSOR' | 'DISK_SECTOR' | 'NETWORK_NIC';

export interface CPURegisters {
  pc: number;
  acc: number;
  sp: number; // Stack pointer
  flags: {
    zero: boolean;
    interruptEnable: boolean;
  };
}

export interface InterfaceRegisters {
  status: {
    busy: boolean;
    ready: boolean;
    error: boolean;
  };
  control: {
    interruptEnable: boolean;
    readCmd: boolean;
  };
  dataRegister: number; // 8-bit byte
}

export interface PeripheralDevice {
  type: PeripheralDeviceType;
  name: string;
  bufferData: number[];
  currentIndex: number;
  latencyCycles: number;
  cyclesRemaining: number;
  state: 'IDLE' | 'BUSY_PROCESSING' | 'DATA_READY' | 'ERROR';
}

export interface IOStep {
  stepIndex: number;
  cycle: number;
  title: string;
  description: string;
  explanation: string;
  activeBus: 'ADDRESS' | 'DATA' | 'CONTROL' | 'INTERRUPT' | 'NONE';
  busPayload?: string;
  signalLines: {
    intr: boolean;
    inta: boolean;
    ior: boolean;
    iow: boolean;
    memw: boolean;
  };
  cpu: CPURegisters;
  ioInterface: InterfaceRegisters;
  device: {
    state: string;
    cyclesRemaining: number;
    currentByte?: number;
  };
  memoryStack: number[];
  transferredBytes: number[];
  wastedCyclesCount: number;
  productiveCyclesCount: number;
  phase: 
    | 'IDLE'
    | 'ISSUE_READ_CMD'
    | 'POLLING_BUSY_WAIT'
    | 'DEVICE_PROCESSING'
    | 'INTERRUPT_TRIGGER'
    | 'INTA_HANDSHAKE'
    | 'SAVE_CONTEXT_STACK'
    | 'VECTOR_FETCH'
    | 'EXECUTE_ISR'
    | 'TRANSFER_BYTE'
    | 'RESTORE_CONTEXT'
    | 'COMPLETE';
}

export interface IOTransferConfig {
  mode: IOMode;
  deviceType: PeripheralDeviceType;
  dataToTransfer: number[];
  deviceLatencyCycles: number; // number of cycles device takes to prepare a byte
}

export interface IOTransferResult {
  config: IOTransferConfig;
  steps: IOStep[];
  totalCycles: number;
  wastedPollingCycles: number;
  productiveCycles: number;
  cpuUtilizationPercentage: number;
  transferredData: number[];
}

export function simulateIOTransfer(config: IOTransferConfig): IOTransferResult {
  const { mode, deviceType, dataToTransfer, deviceLatencyCycles } = config;

  const steps: IOStep[] = [];
  const transferredBytes: number[] = [];
  const memoryStack: number[] = [];

  let cycle = 0;
  let wastedPollingCycles = 0;
  let productiveCycles = 0;

  const cpu: CPURegisters = {
    pc: 0x1000,
    acc: 0x00,
    sp: 0xFFF0,
    flags: {
      zero: false,
      interruptEnable: mode === 'INTERRUPT_DRIVEN',
    },
  };

  const ioInterface: InterfaceRegisters = {
    status: { busy: false, ready: false, error: false },
    control: { interruptEnable: mode === 'INTERRUPT_DRIVEN', readCmd: false },
    dataRegister: 0x00,
  };

  const getDeviceName = (type: PeripheralDeviceType) => {
    switch (type) {
      case 'KEYBOARD': return 'Keyboard Buffer';
      case 'TEMP_SENSOR': return 'ADC Temp Sensor';
      case 'DISK_SECTOR': return 'Disk Sector Controller';
      case 'NETWORK_NIC': return 'Ethernet Controller';
    }
  };

  // Helper to clone state and push step
  const pushStep = (
    phase: IOStep['phase'],
    title: string,
    description: string,
    explanation: string,
    activeBus: IOStep['activeBus'],
    busPayload: string | undefined,
    signalLines: IOStep['signalLines'],
    isWasted: boolean,
    deviceState: string,
    deviceRemaining: number,
    currentByte?: number
  ) => {
    cycle++;
    if (isWasted) {
      wastedPollingCycles++;
    } else {
      productiveCycles++;
    }

    steps.push({
      stepIndex: steps.length,
      cycle,
      title,
      description,
      explanation,
      activeBus,
      busPayload,
      signalLines: { ...signalLines },
      cpu: {
        pc: cpu.pc,
        acc: cpu.acc,
        sp: cpu.sp,
        flags: { ...cpu.flags },
      },
      ioInterface: {
        status: { ...ioInterface.status },
        control: { ...ioInterface.control },
        dataRegister: ioInterface.dataRegister,
      },
      device: {
        state: deviceState,
        cyclesRemaining: deviceRemaining,
        currentByte,
      },
      memoryStack: [...memoryStack],
      transferredBytes: [...transferredBytes],
      wastedCyclesCount: wastedPollingCycles,
      productiveCyclesCount: productiveCycles,
      phase,
    });
  };

  // Step 0: Initial State
  pushStep(
    'IDLE',
    'System Initialized',
    `I/O subsystem configured in ${mode === 'PROGRAMMED_IO' ? 'Programmed I/O (Polling)' : 'Interrupt-Driven I/O'} mode for ${getDeviceName(deviceType)}.`,
    'CPU is executing main program tasks at PC=0x1000. I/O Interface is idle.',
    'NONE',
    undefined,
    { intr: false, inta: false, ior: false, iow: false, memw: false },
    false,
    'IDLE',
    0
  );

  for (let byteIndex = 0; byteIndex < dataToTransfer.length; byteIndex++) {
    const targetByte = dataToTransfer[byteIndex];

    if (mode === 'PROGRAMMED_IO') {
      // 1. CPU issues Read Command to I/O Interface
      ioInterface.control.readCmd = true;
      ioInterface.status.busy = true;
      ioInterface.status.ready = false;
      cpu.pc = 0x1004;

      pushStep(
        'ISSUE_READ_CMD',
        `Byte [${byteIndex + 1}/${dataToTransfer.length}]: CPU Issues READ Command`,
        `CPU executes OUT 0x80 (I/O Read Command). Control Register updated: READ_CMD=1.`,
        'CPU explicitly queries the I/O interface to initiate a single byte transfer. The interface sets its Status BUSY flag to 1.',
        'CONTROL',
        'CMD=READ [Port 0x80]',
        { intr: false, inta: false, ior: false, iow: true, memw: false },
        false,
        'BUSY_PROCESSING',
        deviceLatencyCycles,
        targetByte
      );

      // 2. CPU enters Busy-Wait Polling Loop while Device prepares byte
      for (let w = 1; w <= deviceLatencyCycles; w++) {
        const remaining = deviceLatencyCycles - w;
        cpu.pc = 0x1008; // IN 0x81 (Read Status)
        cpu.flags.zero = true; // Status bit says not ready

        pushStep(
          'POLLING_BUSY_WAIT',
          `Polling Loop (Cycle ${w}/${deviceLatencyCycles}) — CPU Idle Waiting`,
          `CPU reads Status Register: BUSY=1, READY=0. Branch back to polling loop.`,
          `CPU is stuck in a synchronous tight polling loop (TEST_BIT READY -> JNZ WAIT). CPU cycles are being wasted doing zero productive computation while ${getDeviceName(deviceType)} is preparing data.`,
          'DATA',
          'STATUS = 0x01 (BUSY)',
          { intr: false, inta: false, ior: true, iow: false, memw: false },
          true, // Wasted cycle!
          remaining === 0 ? 'DATA_READY' : 'BUSY_PROCESSING',
          remaining,
          targetByte
        );
      }

      // 3. Device finishes, Interface updates READY=1, BUSY=0
      ioInterface.status.busy = false;
      ioInterface.status.ready = true;
      ioInterface.dataRegister = targetByte;

      pushStep(
        'DEVICE_PROCESSING',
        `Device Ready: Byte 0x${targetByte.toString(16).toUpperCase()} in Buffer`,
        `Device latches data 0x${targetByte.toString(16).toUpperCase()} into I/O Data Register. Status Register READY bit set to 1.`,
        'Next poll by CPU detects READY=1 and breaks out of the waiting loop.',
        'DATA',
        `DATA_BUF = 0x${targetByte.toString(16).toUpperCase()}`,
        { intr: false, inta: false, ior: false, iow: false, memw: false },
        false,
        'DATA_READY',
        0,
        targetByte
      );

      // 4. CPU reads data from I/O Port into ACC
      cpu.pc = 0x100C; // IN 0x82 (Read Data)
      cpu.acc = targetByte;
      ioInterface.status.ready = false;

      pushStep(
        'TRANSFER_BYTE',
        `CPU Reads Data Register into Accumulator`,
        `CPU executes IN ACC, 0x82. Accumulator (ACC) gets 0x${targetByte.toString(16).toUpperCase()}.`,
        'CPU fetches the byte across the Data Bus from the I/O interface data buffer.',
        'DATA',
        `DATA = 0x${targetByte.toString(16).toUpperCase()}`,
        { intr: false, inta: false, ior: true, iow: false, memw: false },
        false,
        'IDLE',
        0,
        targetByte
      );

      // 5. CPU stores ACC into memory buffer
      const destMemAddr = 0x2000 + byteIndex;
      cpu.pc = 0x1010;
      transferredBytes.push(targetByte);

      pushStep(
        'TRANSFER_BYTE',
        `Store to RAM [0x${destMemAddr.toString(16).toUpperCase()}]`,
        `CPU executes MOV [0x${destMemAddr.toString(16).toUpperCase()}], ACC. Byte committed to RAM buffer.`,
        `Byte successfully written to main memory. CPU advances to next byte transfer.`,
        'ADDRESS',
        `ADDR=0x${destMemAddr.toString(16).toUpperCase()}, DATA=0x${targetByte.toString(16).toUpperCase()}`,
        { intr: false, inta: false, ior: false, iow: false, memw: true },
        false,
        'IDLE',
        0,
        targetByte
      );

    } else {
      // INTERRUPT-DRIVEN I/O
      // 1. CPU initiates non-blocking read and continues main user program
      ioInterface.control.readCmd = true;
      ioInterface.status.busy = true;
      ioInterface.status.ready = false;
      cpu.pc = 0x1004;

      pushStep(
        'ISSUE_READ_CMD',
        `Byte [${byteIndex + 1}/${dataToTransfer.length}]: Async I/O Initiated`,
        `CPU triggers I/O command and immediately returns to compute main user task at PC=0x1020.`,
        'Unlike Programmed I/O, the CPU does NOT block or poll. It executes productive application tasks while hardware works concurrently.',
        'CONTROL',
        'START_ASYNC_READ',
        { intr: false, inta: false, ior: false, iow: true, memw: false },
        false,
        'BUSY_PROCESSING',
        deviceLatencyCycles,
        targetByte
      );

      // 2. CPU does productive compute cycles while device prepares data asynchronously
      for (let p = 1; p <= deviceLatencyCycles; p++) {
        const remaining = deviceLatencyCycles - p;
        cpu.pc = 0x1020 + (p * 4); // Productive user program instructions
        cpu.acc = (cpu.acc + 1) & 0xFF;

        pushStep(
          'DEVICE_PROCESSING',
          `Concurrent Execution: CPU computes App Task (PC=0x${cpu.pc.toString(16).toUpperCase()})`,
          `CPU is executing useful user calculations. Peripheral prepares byte in background.`,
          `Zero wasted cycles! Hardware concurrency enables maximum CPU utilization. Remaining device latency: ${remaining} cycle(s).`,
          'NONE',
          undefined,
          { intr: false, inta: false, ior: false, iow: false, memw: false },
          false, // Productive cycle!
          remaining === 0 ? 'DATA_READY' : 'BUSY_PROCESSING',
          remaining,
          targetByte
        );
      }

      // 3. Device finishes, Interface latches data and raises INTR line
      ioInterface.status.busy = false;
      ioInterface.status.ready = true;
      ioInterface.dataRegister = targetByte;

      pushStep(
        'INTERRUPT_TRIGGER',
        'Device Asserts Hardware Interrupt (INTR=1)',
        `I/O Controller pulls INTR line HIGH to signal CPU that byte 0x${targetByte.toString(16).toUpperCase()} is ready.`,
        'At the completion of the current instruction cycle, the CPU checks its INTR pin and recognizes the pending interrupt.',
        'INTERRUPT',
        'INTR = HIGH',
        { intr: true, inta: false, ior: false, iow: false, memw: false },
        false,
        'DATA_READY',
        0,
        targetByte
      );

      // 4. CPU acknowledges with INTA pulse
      pushStep(
        'INTA_HANDSHAKE',
        'CPU Asserts Interrupt Acknowledge (INTA=1)',
        'CPU sends INTA pulse across control bus to request the Interrupt Vector Number from the I/O Controller.',
        'The I/O controller receives INTA and places its assigned Vector Code (0x44) onto the Data Bus.',
        'CONTROL',
        'INTA = HIGH',
        { intr: false, inta: true, ior: false, iow: false, memw: false },
        false,
        'DATA_READY',
        0,
        targetByte
      );

      // 5. Hardware saves context: Push PC & Flags to Stack
      const savedPC = cpu.pc + 4;
      memoryStack.push(savedPC);
      cpu.sp -= 2;

      pushStep(
        'SAVE_CONTEXT_STACK',
        `Hardware Context Save: PUSH PC (0x${savedPC.toString(16).toUpperCase()}) to Stack`,
        `CPU hardware pushes current Program Counter and Flags onto memory stack (SP=0x${cpu.sp.toString(16).toUpperCase()}).`,
        'This ensures the CPU can seamlessly return to the interrupted user program without losing its state.',
        'ADDRESS',
        `SP=0x${cpu.sp.toString(16).toUpperCase()} PUSH PC=0x${savedPC.toString(16).toUpperCase()}`,
        { intr: false, inta: false, ior: false, iow: false, memw: true },
        false,
        'DATA_READY',
        0,
        targetByte
      );

      // 6. Vector Fetch & Branch to ISR
      const isrVectorAddress = 0x0800; // Address of I/O ISR in vector table
      cpu.pc = isrVectorAddress;

      pushStep(
        'VECTOR_FETCH',
        'Vector Table Lookup -> Branch to ISR (0x0800)',
        'CPU loads PC from Interrupt Vector Table entry 0x44 -> PC = 0x0800 (I/O Service Routine).',
        'The CPU enters privileged supervisor mode and begins executing the device driver ISR.',
        'ADDRESS',
        'IVT[0x44] -> PC=0x0800',
        { intr: false, inta: false, ior: true, iow: false, memw: false },
        false,
        'DATA_READY',
        0,
        targetByte
      );

      // 7. Execute ISR: Read data from I/O Port
      cpu.acc = targetByte;
      cpu.pc = 0x0804;
      ioInterface.status.ready = false;

      pushStep(
        'EXECUTE_ISR',
        `ISR Body: IN ACC, 0x82 -> Fetch Byte 0x${targetByte.toString(16).toUpperCase()}`,
        `ISR reads data byte 0x${targetByte.toString(16).toUpperCase()} from I/O port into Accumulator.`,
        'The read clears the I/O interface interrupt flag and resets READY status.',
        'DATA',
        `DATA = 0x${targetByte.toString(16).toUpperCase()}`,
        { intr: false, inta: false, ior: true, iow: false, memw: false },
        false,
        'IDLE',
        0,
        targetByte
      );

      // 8. Store byte to RAM buffer
      const isrDestAddr = 0x2000 + byteIndex;
      cpu.pc = 0x0808;
      transferredBytes.push(targetByte);

      pushStep(
        'TRANSFER_BYTE',
        `ISR Body: MOV [0x${isrDestAddr.toString(16).toUpperCase()}], ACC`,
        `ISR stores received byte into application ring buffer at RAM [0x${isrDestAddr.toString(16).toUpperCase()}].`,
        'Byte safely buffered in main memory.',
        'ADDRESS',
        `ADDR=0x${isrDestAddr.toString(16).toUpperCase()} DATA=0x${targetByte.toString(16).toUpperCase()}`,
        { intr: false, inta: false, ior: false, iow: false, memw: true },
        false,
        'IDLE',
        0,
        targetByte
      );

      // 9. IRET (Interrupt Return) -> Pop Stack and Resume Main Program
      const restoredPC = memoryStack.pop() || 0x1024;
      cpu.sp += 2;
      cpu.pc = restoredPC;

      pushStep(
        'RESTORE_CONTEXT',
        `IRET: POP PC (0x${restoredPC.toString(16).toUpperCase()}) -> Resume Main Program`,
        `CPU executes IRET instruction. Restores PC to 0x${restoredPC.toString(16).toUpperCase()} and resumes main user program.`,
        'Interrupt handling cycle complete. CPU seamlessly continues normal computation without missing a beat.',
        'ADDRESS',
        `POP PC -> 0x${restoredPC.toString(16).toUpperCase()}`,
        { intr: false, inta: false, ior: false, iow: false, memw: false },
        false,
        'IDLE',
        0,
        targetByte
      );
    }
  }

  // Final Completion Step
  pushStep(
    'COMPLETE',
    'I/O Transfer Complete',
    `Successfully transferred all ${dataToTransfer.length} byte(s) [${transferredBytes.map(b => '0x' + b.toString(16).toUpperCase()).join(', ')}].`,
    `Performance Summary: Total Cycles = ${cycle}, Productive Cycles = ${productiveCycles}, Wasted Polling Cycles = ${wastedPollingCycles}. CPU Efficiency = ${((productiveCycles / cycle) * 100).toFixed(1)}%.`,
    'NONE',
    undefined,
    { intr: false, inta: false, ior: false, iow: false, memw: false },
    false,
    'IDLE',
    0
  );

  const totalCycles = steps.length > 0 ? steps[steps.length - 1].cycle : 0;
  const cpuUtilizationPercentage = totalCycles > 0 ? Math.round((productiveCycles / totalCycles) * 100) : 100;

  return {
    config,
    steps,
    totalCycles,
    wastedPollingCycles,
    productiveCycles,
    cpuUtilizationPercentage,
    transferredData: transferredBytes,
  };
}
