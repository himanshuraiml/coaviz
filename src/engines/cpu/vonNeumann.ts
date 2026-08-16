export interface VonNeumannRegisters {
  pc: number;   // Program Counter
  mar: number;  // Memory Address Register
  mdr: number;  // Memory Data Register (MBR)
  ir: { opcode: string; address: number; raw: string }; // Instruction Register
  ac: number;   // Accumulator
  cu: { state: string; activeSignal: string }; // Control Unit
}

export interface MemoryCell {
  address: number;
  type: 'INSTRUCTION' | 'DATA';
  label?: string;
  value: number;
  instructionText?: string;
  isAccessing?: boolean;
}

export interface VonNeumannStep {
  stepIndex: number;
  cycle: number;
  phase: 'FETCH' | 'DECODE' | 'OPERAND_FETCH' | 'EXECUTE' | 'STORE' | 'HALT';
  title: string;
  description: string;
  explanation: string;
  activeBus: 'ADDRESS_BUS' | 'DATA_BUS' | 'CONTROL_BUS' | 'INTERNAL_CPU_BUS' | 'NONE';
  busPayload?: string;
  activeComponent: 'PC' | 'MAR' | 'MDR' | 'IR' | 'CU' | 'ALU' | 'AC' | 'MEMORY' | 'IO_INPUT' | 'IO_OUTPUT';
  registers: VonNeumannRegisters;
  memory: MemoryCell[];
  bottleneckActive: boolean;
  bottleneckExplanation?: string;
  ioState: {
    inputVal?: number;
    outputVal?: number;
  };
}

export interface VonNeumannConfig {
  programName: 'ADD_TWO_NUMBERS' | 'BOTTLENECK_DEMO' | 'MULTIPLY_ACCUMULATE';
  customA?: number;
  customB?: number;
}

export interface VonNeumannResult {
  config: VonNeumannConfig;
  steps: VonNeumannStep[];
  totalCycles: number;
  instructionCount: number;
  busAccessCount: { instructionFetches: number; dataAccesses: number };
  finalAccumulator: number;
}

export function simulateVonNeumann(config: VonNeumannConfig): VonNeumannResult {
  const { customA = 15, customB = 27 } = config;

  const steps: VonNeumannStep[] = [];
  let cycle = 0;
  let instructionFetches = 0;
  let dataAccesses = 0;

  // Initialize unified Von Neumann memory (Unified Code + Data)
  const memory: MemoryCell[] = [
    // Code Segment (0x00 - 0x05)
    { address: 0x00, type: 'INSTRUCTION', label: 'START', value: 0x1020, instructionText: 'LOAD [0x20]' },
    { address: 0x01, type: 'INSTRUCTION', value: 0x2021, instructionText: 'ADD [0x21]' },
    { address: 0x02, type: 'INSTRUCTION', value: 0x3022, instructionText: 'STORE [0x22]' },
    { address: 0x03, type: 'INSTRUCTION', value: 0x4023, instructionText: 'OUT [0x22]' },
    { address: 0x04, type: 'INSTRUCTION', value: 0x0000, instructionText: 'HALT' },
    { address: 0x05, type: 'INSTRUCTION', value: 0x0000, instructionText: 'NOP' },
    
    // Data Segment (0x20 - 0x24 in the SAME memory space)
    { address: 0x20, type: 'DATA', label: 'Var A', value: customA },
    { address: 0x21, type: 'DATA', label: 'Var B', value: customB },
    { address: 0x22, type: 'DATA', label: 'Var C (Sum)', value: 0 },
    { address: 0x23, type: 'DATA', label: 'I/O Port', value: 0 },
  ];

  const registers: VonNeumannRegisters = {
    pc: 0x00,
    mar: 0x00,
    mdr: 0x00,
    ir: { opcode: 'NOP', address: 0, raw: '0x0000' },
    ac: 0,
    cu: { state: 'IDLE', activeSignal: 'NONE' },
  };

  const ioState: { inputVal?: number; outputVal?: number } = {
    inputVal: customA,
    outputVal: undefined,
  };

  const pushStep = (
    phase: VonNeumannStep['phase'],
    title: string,
    description: string,
    explanation: string,
    activeBus: VonNeumannStep['activeBus'],
    busPayload: string | undefined,
    activeComponent: VonNeumannStep['activeComponent'],
    bottleneckActive: boolean,
    bottleneckExplanation?: string,
    accessingAddr?: number
  ) => {
    cycle++;
    const memSnapshot = memory.map((m) => ({
      ...m,
      isAccessing: accessingAddr !== undefined ? m.address === accessingAddr : false,
    }));

    steps.push({
      stepIndex: steps.length,
      cycle,
      phase,
      title,
      description,
      explanation,
      activeBus,
      busPayload,
      activeComponent,
      registers: {
        pc: registers.pc,
        mar: registers.mar,
        mdr: registers.mdr,
        ir: { ...registers.ir },
        ac: registers.ac,
        cu: { ...registers.cu },
      },
      memory: memSnapshot,
      bottleneckActive,
      bottleneckExplanation,
      ioState: { ...ioState },
    });
  };

  // Step 0: Power-on Init
  pushStep(
    'FETCH',
    'System Power-On: Stored-Program Concept',
    'Von Neumann architecture initialized: Code and Data reside together in unified Main Memory.',
    'John von Neumann (1945) proposed the Stored-Program architecture where CPU registers (PC, MAR, MDR, IR, AC), Control Unit, and ALU communicate with a single unified memory over shared buses.',
    'NONE',
    undefined,
    'PC',
    false
  );

  // EXECUTE INSTRUCTION 1: LOAD [0x20]
  // 1.1 PC -> MAR
  registers.mar = registers.pc;
  pushStep(
    'FETCH',
    'Instruction 1 Fetch: PC -> MAR',
    `Program Counter (PC=0x00) loaded into Memory Address Register (MAR=0x00).`,
    'The CPU prepares to fetch the first instruction word from memory by driving the Address Bus.',
    'ADDRESS_BUS',
    'ADDR = 0x00',
    'MAR',
    false
  );

  // 1.2 Memory Read -> MDR
  registers.mdr = 0x1020;
  instructionFetches++;
  pushStep(
    'FETCH',
    'Instruction 1 Fetch: Memory[0x00] -> MDR',
    'Memory reads instruction word (0x1020 "LOAD [0x20]") onto the shared Data Bus into MDR.',
    'Notice that the shared bus is now occupied fetching the opcode. Data operands cannot be fetched simultaneously.',
    'DATA_BUS',
    'DATA = 0x1020 (LOAD [0x20])',
    'MDR',
    false,
    undefined,
    0x00
  );

  // 1.3 MDR -> IR, PC++
  registers.ir = { opcode: 'LOAD', address: 0x20, raw: 'LOAD [0x20]' };
  registers.pc = 0x01;
  pushStep(
    'FETCH',
    'Instruction 1 Fetch: MDR -> IR, PC Increment',
    'Instruction loaded into Instruction Register (IR). PC incremented to 0x01 for next instruction.',
    'The Instruction Register holds the opcode so the Control Unit can decode it.',
    'INTERNAL_CPU_BUS',
    'IR <= MDR, PC <= PC+1',
    'IR',
    false
  );

  // 1.4 Decode
  registers.cu = { state: 'DECODE_LOAD', activeSignal: 'MEM_READ_ENABLE' };
  pushStep(
    'DECODE',
    'Control Unit Decodes: LOAD Command',
    'Control Unit recognizes opcode LOAD. Target memory address is 0x20 (Variable A).',
    'The Control Unit sets up internal control lines to initiate a second memory access cycle for the data operand.',
    'NONE',
    undefined,
    'CU',
    false
  );

  // 1.5 Operand Fetch (MAR <= 0x20)
  registers.mar = 0x20;
  pushStep(
    'OPERAND_FETCH',
    'Operand Fetch: MAR <= 0x20 (Von Neumann Shared Bus Access)',
    'MAR set to 0x20 to fetch Variable A. Memory Address Bus is re-activated for data.',
    'Von Neumann Bottleneck in action: The same shared bus that fetched the instruction must now be reused to fetch data.',
    'ADDRESS_BUS',
    'ADDR = 0x20',
    'MAR',
    true,
    'Von Neumann Bottleneck: CPU must wait for another memory bus cycle because Instructions and Data share the exact same bus.'
  );

  // 1.6 Memory Read Data -> MDR
  registers.mdr = customA;
  dataAccesses++;
  pushStep(
    'OPERAND_FETCH',
    `Operand Loaded: MDR <= Memory[0x20] (${customA})`,
    `Data value ${customA} transferred across Data Bus into MDR.`,
    'The operand is now inside CPU boundary registers.',
    'DATA_BUS',
    `DATA = 0x${customA.toString(16).toUpperCase()} (${customA})`,
    'MDR',
    true,
    'Sequential bus bottleneck: CPU throughput is strictly capped by single memory bus bandwidth.',
    0x20
  );

  // 1.7 Execute: MDR -> AC
  registers.ac = customA;
  pushStep(
    'EXECUTE',
    `Execute LOAD: AC <= MDR (${customA})`,
    `Accumulator (AC) loaded with ${customA}. Variable A ready for arithmetic computation.`,
    'Accumulator holds the working value inside the CPU ALU datapath.',
    'INTERNAL_CPU_BUS',
    `AC <= ${customA}`,
    'AC',
    false
  );

  // EXECUTE INSTRUCTION 2: ADD [0x21]
  // 2.1 PC -> MAR
  registers.mar = registers.pc;
  pushStep(
    'FETCH',
    'Instruction 2 Fetch: PC -> MAR (0x01)',
    'MAR loaded with PC=0x01 for the second instruction.',
    'CPU fetches the next sequential instruction from unified memory.',
    'ADDRESS_BUS',
    'ADDR = 0x01',
    'MAR',
    false
  );

  // 2.2 Memory[0x01] -> MDR
  registers.mdr = 0x2021;
  instructionFetches++;
  pushStep(
    'FETCH',
    'Instruction 2 Fetch: Memory[0x01] -> MDR (ADD [0x21])',
    'MDR receives instruction word 0x2021 ("ADD [0x21]").',
    'Shared data bus transports the opcode to the CPU.',
    'DATA_BUS',
    'DATA = 0x2021 (ADD [0x21])',
    'MDR',
    false,
    undefined,
    0x01
  );

  // 2.3 MDR -> IR, PC++
  registers.ir = { opcode: 'ADD', address: 0x21, raw: 'ADD [0x21]' };
  registers.pc = 0x02;
  pushStep(
    'FETCH',
    'Instruction 2 Fetch: MDR -> IR, PC Incremented to 0x02',
    'IR gets ADD [0x21]. PC advances to 0x02.',
    'Control Unit now takes over to decode arithmetic operation.',
    'INTERNAL_CPU_BUS',
    'IR <= MDR, PC <= PC+1',
    'IR',
    false
  );

  // 2.4 Decode
  registers.cu = { state: 'DECODE_ADD', activeSignal: 'ALU_ADD_SIGNAL' };
  pushStep(
    'DECODE',
    'Control Unit Decodes: ADD Operation',
    'Control Unit decodes ADD opcode. Signals ALU to add operand at memory address 0x21 to Accumulator.',
    'ALU prepares its adder circuits.',
    'NONE',
    undefined,
    'CU',
    false
  );

  // 2.5 Operand Fetch MAR <= 0x21
  registers.mar = 0x21;
  pushStep(
    'OPERAND_FETCH',
    'Operand 2 Fetch: MAR <= 0x21 (Variable B)',
    'MAR set to 0x21 to fetch Variable B.',
    'Second memory access for instruction 2.',
    'ADDRESS_BUS',
    'ADDR = 0x21',
    'MAR',
    true,
    'Von Neumann Bottleneck: Separate memory cycles required for instruction and operand.'
  );

  // 2.6 MDR <= Memory[0x21]
  registers.mdr = customB;
  dataAccesses++;
  pushStep(
    'OPERAND_FETCH',
    `Operand 2 Loaded: MDR <= Memory[0x21] (${customB})`,
    `MDR receives Variable B (${customB}) from unified memory data segment.`,
    'Operand is transferred over Data Bus into CPU MDR.',
    'DATA_BUS',
    `DATA = 0x${customB.toString(16).toUpperCase()} (${customB})`,
    'MDR',
    false,
    undefined,
    0x21
  );

  // 2.7 ALU Execute: AC <= AC + MDR
  const sumResult = customA + customB;
  registers.ac = sumResult;
  pushStep(
    'EXECUTE',
    `ALU Execution: AC <= AC + MDR (${customA} + ${customB} = ${sumResult})`,
    `Arithmetic Logic Unit (ALU) computes ${customA} + ${customB} = ${sumResult}. Result written to Accumulator.`,
    'ALU completes addition and updates processor status flags (Zero, Carry).',
    'INTERNAL_CPU_BUS',
    `ALU_OUT = ${sumResult}`,
    'ALU',
    false
  );

  // EXECUTE INSTRUCTION 3: STORE [0x22]
  // 3.1 Fetch
  registers.mar = registers.pc;
  registers.mdr = 0x3022;
  instructionFetches++;
  registers.ir = { opcode: 'STORE', address: 0x22, raw: 'STORE [0x22]' };
  registers.pc = 0x03;
  pushStep(
    'FETCH',
    'Instruction 3 Fetch: STORE [0x22]',
    'CPU fetches instruction 3: STORE [0x22] from address 0x02 into IR.',
    'Instruction fetched over shared memory bus.',
    'DATA_BUS',
    'DATA = 0x3022 (STORE [0x22])',
    'IR',
    false,
    undefined,
    0x02
  );

  // 3.2 Store Execution: AC -> MDR -> Memory[0x22]
  registers.mar = 0x22;
  registers.mdr = sumResult;
  const targetCell = memory.find((m) => m.address === 0x22);
  if (targetCell) targetCell.value = sumResult;
  dataAccesses++;

  pushStep(
    'STORE',
    `Store Result to Unified RAM: Memory[0x22] <= AC (${sumResult})`,
    `Accumulator result ${sumResult} written to Memory[0x22] (Variable C).`,
    'CPU drives Address Bus (0x22) and Data Bus (Sum value) with Memory Write control line asserted.',
    'DATA_BUS',
    `ADDR=0x22, DATA=${sumResult}`,
    'MEMORY',
    false,
    undefined,
    0x22
  );

  // EXECUTE INSTRUCTION 4: OUT
  registers.mar = registers.pc;
  registers.mdr = 0x4023;
  instructionFetches++;
  registers.ir = { opcode: 'OUT', address: 0x23, raw: 'OUT [0x22]' };
  registers.pc = 0x04;
  ioState.outputVal = sumResult;

  pushStep(
    'EXECUTE',
    `I/O Output: Display/Console Receives Result (${sumResult})`,
    `CPU transmits computation result ${sumResult} to I/O Output display device.`,
    'Von Neumann I/O subsystem transmits the verified result to external peripherals.',
    'CONTROL_BUS',
    `I/O_OUT = ${sumResult}`,
    'IO_OUTPUT',
    false
  );

  // EXECUTE INSTRUCTION 5: HALT
  registers.ir = { opcode: 'HALT', address: 0, raw: 'HALT' };
  registers.cu = { state: 'HALTED', activeSignal: 'HALT_CPU' };

  pushStep(
    'HALT',
    'Program Execution Complete (HALT)',
    `Program halted successfully. Stored-program computation complete. Final sum in RAM[0x22] = ${sumResult}.`,
    `Summary: Total Cycles = ${cycle}, Instruction Fetches = ${instructionFetches}, Data Accesses = ${dataAccesses}. Shared bus utilization was 100% across the fetch-decode-execute loop.`,
    'NONE',
    undefined,
    'CU',
    false
  );

  return {
    config,
    steps,
    totalCycles: steps.length,
    instructionCount: 4,
    busAccessCount: { instructionFetches, dataAccesses },
    finalAccumulator: sumResult,
  };
}
