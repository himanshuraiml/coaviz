export type ControlUnitType = 'HARDWIRED' | 'MICROPROGRAMMED';

export type InstructionOpcode = 'ADD' | 'LDA' | 'STA' | 'BUN' | 'BSA' | 'ISZ' | 'AND';

export interface HardwiredStep {
  timingSignal: string; // T0, T1, T2, T3, T4, T5
  activeGates: string[]; // AND/OR gate identifiers
  activeControlSignals: string[]; // e.g. ['MAR_LOAD', 'PC_READ', 'BUS_FROM_PC']
  registerTransfers: string[]; // e.g. ['MAR <- PC']
  description: string;
  explanation: string;
  isSCReset?: boolean;
}

export interface MicroInstruction {
  address: number; // CAR address (hex/dec)
  label?: string;
  f1_alu: 'NOP' | 'ADD' | 'AND' | 'INC' | 'CLR';
  f2_bus: 'NOP' | 'MAR_PC' | 'PC_INCR' | 'IR_MDR' | 'MDR_MEM' | 'MEM_MDR' | 'AC_MDR' | 'MDR_AC' | 'MAR_IR';
  cd_condition: 'U' | 'I' | 'S' | 'Z'; // Unconditional, Indirect, Sign, Zero
  br_branch: 'NEXT' | 'JMP' | 'CALL' | 'RET' | 'MAP';
  nextAddress: number; // AD field
  rawControlWord: string;
  microOperation: string;
}

export interface MicroprogrammedStep {
  car: number; // Control Address Register
  cdr: MicroInstruction; // Control Data Register (MIR)
  sbr: number | null; // Subroutine Register
  branchConditionStatus: string;
  nextCar: number;
  activeControlLines: string[];
  description: string;
  explanation: string;
}

export interface ControlUnitSimulationResult {
  mode: ControlUnitType;
  opcode: InstructionOpcode;
  isIndirect: boolean;
  instructionHex: string;
  steps: (HardwiredStep | MicroprogrammedStep)[];
  totalSteps: number;
}

// Micro-program ROM memory table (Wilkes / Mano Architecture style)
export const MICRO_ROM: MicroInstruction[] = [
  // --- FETCH ROUTINE (Addresses 0..2) ---
  {
    address: 0,
    label: 'FETCH_0',
    f1_alu: 'NOP',
    f2_bus: 'MAR_PC',
    cd_condition: 'U',
    br_branch: 'NEXT',
    nextAddress: 1,
    rawControlWord: '000-001-00-00-0000001',
    microOperation: 'MAR ← PC, PC ← PC + 1',
  },
  {
    address: 1,
    label: 'FETCH_1',
    f1_alu: 'NOP',
    f2_bus: 'MDR_MEM',
    cd_condition: 'U',
    br_branch: 'NEXT',
    nextAddress: 2,
    rawControlWord: '000-010-00-00-0000010',
    microOperation: 'MDR ← M[MAR], IR ← MDR',
  },
  {
    address: 2,
    label: 'DECODE_MAP',
    f1_alu: 'NOP',
    f2_bus: 'MAR_IR',
    cd_condition: 'I',
    br_branch: 'MAP', // Map Opcode to routine address (or check Indirect)
    nextAddress: 4, // Indirect handler if I=1
    rawControlWord: '000-011-01-11-0000100',
    microOperation: 'MAR ← IR(Address); If (I=1) JMP INDIR else MAP Opcode',
  },

  // --- INDIRECT ROUTINE (Addresses 4..5) ---
  {
    address: 4,
    label: 'INDIR_0',
    f1_alu: 'NOP',
    f2_bus: 'MDR_MEM',
    cd_condition: 'U',
    br_branch: 'NEXT',
    nextAddress: 5,
    rawControlWord: '000-010-00-00-0000101',
    microOperation: 'MDR ← M[MAR]',
  },
  {
    address: 5,
    label: 'INDIR_1',
    f1_alu: 'NOP',
    f2_bus: 'MAR_IR',
    cd_condition: 'U',
    br_branch: 'MAP',
    nextAddress: 0,
    rawControlWord: '000-011-00-11-0000000',
    microOperation: 'MAR ← MDR(Address); MAP Opcode',
  },

  // --- ADD ROUTINE (Addresses 10..12) ---
  {
    address: 10,
    label: 'ADD_0',
    f1_alu: 'NOP',
    f2_bus: 'MDR_MEM',
    cd_condition: 'U',
    br_branch: 'NEXT',
    nextAddress: 11,
    rawControlWord: '000-010-00-00-0001011',
    microOperation: 'MDR ← M[MAR] (Fetch Operand)',
  },
  {
    address: 11,
    label: 'ADD_1',
    f1_alu: 'ADD',
    f2_bus: 'NOP',
    cd_condition: 'U',
    br_branch: 'JMP',
    nextAddress: 0, // Return to Fetch
    rawControlWord: '001-000-00-01-0000000',
    microOperation: 'AC ← AC + MDR, CAR ← 0 (Return to FETCH)',
  },

  // --- LDA ROUTINE (Addresses 20..21) ---
  {
    address: 20,
    label: 'LDA_0',
    f1_alu: 'NOP',
    f2_bus: 'MDR_MEM',
    cd_condition: 'U',
    br_branch: 'NEXT',
    nextAddress: 21,
    rawControlWord: '000-010-00-00-0010101',
    microOperation: 'MDR ← M[MAR]',
  },
  {
    address: 21,
    label: 'LDA_1',
    f1_alu: 'NOP',
    f2_bus: 'AC_MDR',
    cd_condition: 'U',
    br_branch: 'JMP',
    nextAddress: 0,
    rawControlWord: '000-100-00-01-0000000',
    microOperation: 'AC ← MDR, CAR ← 0 (Return to FETCH)',
  },

  // --- STA ROUTINE (Addresses 30..31) ---
  {
    address: 30,
    label: 'STA_0',
    f1_alu: 'NOP',
    f2_bus: 'MDR_AC',
    cd_condition: 'U',
    br_branch: 'NEXT',
    nextAddress: 31,
    rawControlWord: '000-101-00-00-0011111',
    microOperation: 'MDR ← AC',
  },
  {
    address: 31,
    label: 'STA_1',
    f1_alu: 'NOP',
    f2_bus: 'MEM_MDR',
    cd_condition: 'U',
    br_branch: 'JMP',
    nextAddress: 0,
    rawControlWord: '000-110-00-01-0000000',
    microOperation: 'M[MAR] ← MDR (Memory Write), CAR ← 0',
  },

  // --- BUN ROUTINE (Addresses 40..40) ---
  {
    address: 40,
    label: 'BUN_0',
    f1_alu: 'NOP',
    f2_bus: 'MAR_PC',
    cd_condition: 'U',
    br_branch: 'JMP',
    nextAddress: 0,
    rawControlWord: '000-001-00-01-0000000',
    microOperation: 'PC ← MAR (Branch Unconditional), CAR ← 0',
  },
];

export const OPCODE_MAP: Record<InstructionOpcode, number> = {
  ADD: 10,
  LDA: 20,
  STA: 30,
  BUN: 40,
  BSA: 50,
  ISZ: 60,
  AND: 70,
};

export function simulateHardwiredCU(
  opcode: InstructionOpcode,
  isIndirect: boolean
): ControlUnitSimulationResult {
  const steps: HardwiredStep[] = [];

  // T0: MAR <- PC
  steps.push({
    timingSignal: 'T0',
    activeGates: ['AND(T0)', 'OR(MAR_LOAD)'],
    activeControlSignals: ['BUS_SEL_PC (010)', 'MAR_LD (Load)', 'SC_INC'],
    registerTransfers: ['MAR ← PC'],
    description: 'Fetch Step 1: Transfer Program Counter to Memory Address Register.',
    explanation: 'At T₀, decoder activates T₀ line. Common bus connects PC output to MAR input.',
  });

  // T1: MBR/MDR <- M[MAR], PC <- PC + 1
  steps.push({
    timingSignal: 'T1',
    activeGates: ['AND(T1)', 'MEM_READ_GATE', 'PC_INR_GATE'],
    activeControlSignals: ['MEM_READ', 'MBR_LD', 'PC_INR (Increment)', 'SC_INC'],
    registerTransfers: ['MBR ← M[MAR]', 'PC ← PC + 1'],
    description: 'Fetch Step 2: Read instruction word into MBR and increment PC.',
    explanation: 'At T₁, Memory READ signal activates; memory places instruction into MBR/MDR; PC increments to next address.',
  });

  // T2: IR <- MBR, Decoder inputs set
  steps.push({
    timingSignal: 'T2',
    activeGates: ['AND(T2)', 'IR_LD_GATE', 'DECODER_3x8'],
    activeControlSignals: ['BUS_SEL_MBR (111)', 'IR_LD', 'OPCODE_DECODE', 'SC_INC'],
    registerTransfers: ['IR ← MBR', 'Opcode Decoder ← IR(14-12)', 'I-FlipFlop ← IR(15)'],
    description: 'Fetch Step 3: Load Instruction Register (IR) and decode Opcode.',
    explanation: 'At T₂, instruction opcode (bits 14-12) is fed to 3-to-8 decoder, bit 15 is latched into Indirect Flip-Flop (I).',
  });

  // T3: Address Decode & Indirect Evaluation
  if (isIndirect) {
    steps.push({
      timingSignal: 'T3',
      activeGates: ['AND(T3, I=1)', 'MAR_LD_GATE', 'MEM_READ_GATE'],
      activeControlSignals: ['MEM_READ', 'MAR_LD', 'BUS_SEL_MBR', 'SC_INC'],
      registerTransfers: ['MAR ← M[MAR] (Indirect EA Fetch)'],
      description: 'Indirect Cycle: Fetch Effective Address from pointer memory location.',
      explanation: 'Since I=1, gate D_I · T₃ asserts Memory Read to resolve the multi-level indirect address pointer into MAR.',
    });
  } else {
    steps.push({
      timingSignal: 'T3',
      activeGates: ['AND(T3, I=0)', 'DIRECT_PASS'],
      activeControlSignals: ['MAR ← IR(Address)', 'SC_INC'],
      registerTransfers: ['MAR ← IR(11-0) (Direct EA)'],
      description: 'Direct Addressing: Effective address already present in MAR.',
      explanation: 'Since I=0, the address in IR(11-0) is directly loaded into MAR.',
    });
  }

  // T4 / T5: Instruction Execution Phase
  switch (opcode) {
    case 'ADD':
      steps.push({
        timingSignal: 'T4',
        activeGates: [`AND(D_${opcode}, T4)`, 'MEM_READ_GATE', 'MBR_LD_GATE'],
        activeControlSignals: ['MEM_READ', 'MBR_LD', 'SC_INC'],
        registerTransfers: ['MBR ← M[MAR] (Operand Fetch)'],
        description: `Execute ADD (T4): Read operand from memory into MBR.`,
        explanation: `Decoder line D_ADD and timing line T₄ enable memory read to fetch the second addend into MBR.`,
      });
      steps.push({
        timingSignal: 'T5',
        activeGates: [`AND(D_${opcode}, T5)`, 'ALU_ADD_GATE', 'AC_LD_GATE', 'SC_CLR_GATE'],
        activeControlSignals: ['ALU_OP_ADD', 'AC_LD', 'SC_CLR (Reset SC to 0)'],
        registerTransfers: ['AC ← AC + MBR', 'E ← Cout', 'SC ← 0'],
        description: `Execute ADD (T5): ALU computes sum and stores in Accumulator (AC); Sequence Counter resets.`,
        explanation: `ALU performs binary addition of AC and MBR. Result latched into AC, Sequence Counter clears to 0 for next instruction.`,
        isSCReset: true,
      });
      break;

    case 'LDA':
      steps.push({
        timingSignal: 'T4',
        activeGates: [`AND(D_${opcode}, T4)`, 'MEM_READ_GATE'],
        activeControlSignals: ['MEM_READ', 'MBR_LD', 'SC_INC'],
        registerTransfers: ['MBR ← M[MAR]'],
        description: `Execute LDA (T4): Fetch word from memory.`,
        explanation: `Memory line reads word at effective address into MBR.`,
      });
      steps.push({
        timingSignal: 'T5',
        activeGates: [`AND(D_${opcode}, T5)`, 'AC_LD_GATE', 'SC_CLR_GATE'],
        activeControlSignals: ['BUS_SEL_MBR', 'AC_LD', 'SC_CLR'],
        registerTransfers: ['AC ← MBR', 'SC ← 0'],
        description: `Execute LDA (T5): Transfer MBR into AC, complete instruction.`,
        explanation: `AC loads data from MBR via common bus. SC is cleared to 0.`,
        isSCReset: true,
      });
      break;

    case 'STA':
      steps.push({
        timingSignal: 'T4',
        activeGates: [`AND(D_${opcode}, T4)`, 'MEM_WRITE_GATE', 'SC_CLR_GATE'],
        activeControlSignals: ['BUS_SEL_AC', 'MBR_LD', 'MEM_WRITE', 'SC_CLR'],
        registerTransfers: ['M[MAR] ← AC', 'SC ← 0'],
        description: `Execute STA (T4): Write AC content into Memory at address MAR.`,
        explanation: `Memory write cycle activated with AC on bus. Sequence counter cleared.`,
        isSCReset: true,
      });
      break;

    case 'BUN':
      steps.push({
        timingSignal: 'T4',
        activeGates: [`AND(D_${opcode}, T4)`, 'PC_LD_GATE', 'SC_CLR_GATE'],
        activeControlSignals: ['BUS_SEL_MAR', 'PC_LD', 'SC_CLR'],
        registerTransfers: ['PC ← MAR', 'SC ← 0'],
        description: `Execute BUN (T4): Branch Unconditional by loading target address into PC.`,
        explanation: `Target address in MAR is loaded directly into Program Counter (PC). Next instruction is fetched from target.`,
        isSCReset: true,
      });
      break;

    default:
      steps.push({
        timingSignal: 'T4',
        activeGates: [`AND(D_${opcode}, T4)`, 'ALU_GATE', 'SC_CLR_GATE'],
        activeControlSignals: ['GENERIC_EXEC', 'SC_CLR'],
        registerTransfers: [`Exec ${opcode}`, 'SC ← 0'],
        description: `Execute ${opcode} micro-operation.`,
        explanation: `Control matrix activates execution signals for ${opcode}.`,
        isSCReset: true,
      });
      break;
  }

  return {
    mode: 'HARDWIRED',
    opcode,
    isIndirect,
    instructionHex: `${isIndirect ? '1' : '0'}${opcode.substring(0, 3)}`,
    steps,
    totalSteps: steps.length,
  };
}

export function simulateMicroprogrammedCU(
  opcode: InstructionOpcode,
  isIndirect: boolean
): ControlUnitSimulationResult {
  const steps: MicroprogrammedStep[] = [];

  // Step 1: Fetch 0 (CAR = 0)
  const f0 = MICRO_ROM.find((m) => m.address === 0)!;
  steps.push({
    car: 0,
    cdr: f0,
    sbr: null,
    branchConditionStatus: 'Unconditional (Next)',
    nextCar: 1,
    activeControlLines: ['MAR_PC_ENABLE', 'PC_INCR_ENABLE'],
    description: 'Micro-instruction at CAR=0: Fetch PC to MAR, increment PC.',
    explanation: 'Control Address Register (CAR) is 0. Control Word triggers MAR ← PC and PC ← PC + 1. Next CAR = CAR + 1 = 1.',
  });

  // Step 2: Fetch 1 (CAR = 1)
  const f1 = MICRO_ROM.find((m) => m.address === 1)!;
  steps.push({
    car: 1,
    cdr: f1,
    sbr: null,
    branchConditionStatus: 'Unconditional (Next)',
    nextCar: 2,
    activeControlLines: ['MEM_READ_ENABLE', 'IR_LOAD_ENABLE'],
    description: 'Micro-instruction at CAR=1: Read memory into MDR and IR.',
    explanation: 'Control Word triggers memory read: MDR ← M[MAR], IR ← MDR. Sequencer steps to CAR = 2.',
  });

  // Step 3: Decode / Map (CAR = 2)
  const f2 = MICRO_ROM.find((m) => m.address === 2)!;
  const targetOpcodeCar = OPCODE_MAP[opcode] || 10;
  const nextCarAfterDecode = isIndirect ? 4 : targetOpcodeCar;

  steps.push({
    car: 2,
    cdr: f2,
    sbr: null,
    branchConditionStatus: isIndirect ? 'Indirect Bit I=1 ➔ Branch to INDIR (CAR=4)' : `Direct (I=0) ➔ MAP to ${opcode} Routine (CAR=${targetOpcodeCar})`,
    nextCar: nextCarAfterDecode,
    activeControlLines: ['MAR_IR_ENABLE', 'MAPPING_LOGIC_ENABLE'],
    description: `Micro-instruction at CAR=2: Decode Opcode & Branch Condition.`,
    explanation: isIndirect
      ? 'Condition check detects Indirect bit I=1. Sequencer branches to Indirect Routine at CAR = 4.'
      : `Mapping logic transforms Opcode (${opcode}) into Micro-ROM start address CAR = ${targetOpcodeCar}.`,
  });

  // If indirect, step through indirect routine
  if (isIndirect) {
    const ind0 = MICRO_ROM.find((m) => m.address === 4)!;
    steps.push({
      car: 4,
      cdr: ind0,
      sbr: null,
      branchConditionStatus: 'Unconditional (Next)',
      nextCar: 5,
      activeControlLines: ['MEM_READ_ENABLE'],
      description: 'Micro-instruction at CAR=4: Fetch indirect address word from memory.',
      explanation: 'MDR loads address pointer from memory. Sequencer steps to CAR = 5.',
    });

    const ind1 = MICRO_ROM.find((m) => m.address === 5)!;
    steps.push({
      car: 5,
      cdr: ind1,
      sbr: null,
      branchConditionStatus: `MAP to ${opcode} Routine (CAR=${targetOpcodeCar})`,
      nextCar: targetOpcodeCar,
      activeControlLines: ['MAR_IR_ENABLE', 'MAPPING_LOGIC_ENABLE'],
      description: `Micro-instruction at CAR=5: Set MAR to resolved address and jump to ${opcode} routine.`,
      explanation: `Address resolved in MAR. Sequencer maps to opcode starting address CAR = ${targetOpcodeCar}.`,
    });
  }

  // Opcode Micro-Routine
  if (opcode === 'ADD') {
    const add0 = MICRO_ROM.find((m) => m.address === 10)!;
    steps.push({
      car: 10,
      cdr: add0,
      sbr: null,
      branchConditionStatus: 'Unconditional (Next)',
      nextCar: 11,
      activeControlLines: ['MEM_READ_ENABLE', 'MDR_LOAD_ENABLE'],
      description: 'Micro-instruction at CAR=10: Read operand from memory into MDR.',
      explanation: 'Fetch operand from memory address in MAR into MDR. CAR advances to 11.',
    });

    const add1 = MICRO_ROM.find((m) => m.address === 11)!;
    steps.push({
      car: 11,
      cdr: add1,
      sbr: null,
      branchConditionStatus: 'Unconditional (JMP 0)',
      nextCar: 0,
      activeControlLines: ['ALU_ADD_ENABLE', 'AC_LOAD_ENABLE', 'CAR_RESET_0'],
      description: 'Micro-instruction at CAR=11: ALU computes AC + MDR and returns to Fetch (CAR=0).',
      explanation: 'F1 field activates ALU ADD micro-operation. BR field indicates JMP to address 0 to fetch next instruction.',
    });
  } else if (opcode === 'LDA') {
    const lda0 = MICRO_ROM.find((m) => m.address === 20)!;
    steps.push({
      car: 20,
      cdr: lda0,
      sbr: null,
      branchConditionStatus: 'Unconditional (Next)',
      nextCar: 21,
      activeControlLines: ['MEM_READ_ENABLE'],
      description: 'Micro-instruction at CAR=20: Read memory word into MDR.',
      explanation: 'Reads memory word into MDR. Advances to CAR=21.',
    });

    const lda1 = MICRO_ROM.find((m) => m.address === 21)!;
    steps.push({
      car: 21,
      cdr: lda1,
      sbr: null,
      branchConditionStatus: 'Unconditional (JMP 0)',
      nextCar: 0,
      activeControlLines: ['AC_LOAD_MDR', 'CAR_RESET_0'],
      description: 'Micro-instruction at CAR=21: Load AC from MDR and return to Fetch.',
      explanation: 'Transfers MDR to AC. Jumps back to CAR=0.',
    });
  } else if (opcode === 'STA') {
    const sta0 = MICRO_ROM.find((m) => m.address === 30)!;
    steps.push({
      car: 30,
      cdr: sta0,
      sbr: null,
      branchConditionStatus: 'Unconditional (Next)',
      nextCar: 31,
      activeControlLines: ['MDR_LOAD_AC'],
      description: 'Micro-instruction at CAR=30: Copy AC to MDR.',
      explanation: 'MDR receives AC value. CAR advances to 31.',
    });

    const sta1 = MICRO_ROM.find((m) => m.address === 31)!;
    steps.push({
      car: 31,
      cdr: sta1,
      sbr: null,
      branchConditionStatus: 'Unconditional (JMP 0)',
      nextCar: 0,
      activeControlLines: ['MEM_WRITE_ENABLE', 'CAR_RESET_0'],
      description: 'Micro-instruction at CAR=31: Write MDR to memory and return to Fetch.',
      explanation: 'Memory write cycle triggered. CAR resets to 0.',
    });
  } else {
    // BUN
    const bun0 = MICRO_ROM.find((m) => m.address === 40)!;
    steps.push({
      car: 40,
      cdr: bun0,
      sbr: null,
      branchConditionStatus: 'Unconditional (JMP 0)',
      nextCar: 0,
      activeControlLines: ['PC_LOAD_MAR', 'CAR_RESET_0'],
      description: 'Micro-instruction at CAR=40: Set PC = MAR and return to Fetch.',
      explanation: 'Branch Unconditional executes by loading PC with target address from MAR. CAR resets to 0.',
    });
  }

  return {
    mode: 'MICROPROGRAMMED',
    opcode,
    isIndirect,
    instructionHex: `${isIndirect ? '1' : '0'}${opcode.substring(0, 3)}`,
    steps,
    totalSteps: steps.length,
  };
}
