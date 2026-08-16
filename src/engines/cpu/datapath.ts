/**
 * Basic Computer Datapath & Bus Architecture Engine (Mano Machine)
 */

export interface CpuRegisters {
  PC: number;   // 12 bits (0-4095)
  AR: number;   // 12 bits (0-4095)
  DR: number;   // 16 bits (0-65535)
  AC: number;   // 16 bits (0-65535)
  IR: number;   // 16 bits (0-65535)
  TR: number;   // 16 bits (0-65535)
  INPR: number; // 8 bits (0-255)
  OUTR: number; // 8 bits (0-255)
  E: number;    // 1 bit
  I: number;    // 1 bit
  SC: number;   // Timing Sequence Counter (0-7)
}

export type BusSource = 'NONE' | 'AR' | 'PC' | 'DR' | 'AC' | 'IR' | 'TR' | 'MEMORY';

export interface DatapathStep {
  stepIndex: number;
  phase: 'FETCH' | 'DECODE' | 'INDIRECT' | 'EXECUTE' | 'HALTED';
  timingSignal: string; // T0, T1, T2, T3, T4, T5, T6
  microOperation: string;
  busSource: BusSource;
  busSelector: string; // "001" for AR, "010" for PC, etc.
  busValueHex: string;
  activeControlSignals: string[]; // ['READ', 'LD_IR', 'INR_PC', etc.]
  registers: CpuRegisters;
  activeMemoryAddress?: number;
  memoryRead?: boolean;
  memoryWrite?: boolean;
  explanation: string;
  isInstructionComplete: boolean;
}

export interface InstructionDef {
  mnemonic: string;
  opcodeHex: string;
  description: string;
  type: 'MRI' | 'RRI' | 'IOI';
}

export const INSTRUCTION_SET: Record<string, InstructionDef> = {
  AND: { mnemonic: 'AND', opcodeHex: '0', description: 'AND memory word to AC', type: 'MRI' },
  ADD: { mnemonic: 'ADD', opcodeHex: '1', description: 'Add memory word to AC', type: 'MRI' },
  LDA: { mnemonic: 'LDA', opcodeHex: '2', description: 'Load memory word to AC', type: 'MRI' },
  STA: { mnemonic: 'STA', opcodeHex: '3', description: 'Store content of AC in memory', type: 'MRI' },
  BUN: { mnemonic: 'BUN', opcodeHex: '4', description: 'Branch unconditionally', type: 'MRI' },
  BSA: { mnemonic: 'BSA', opcodeHex: '5', description: 'Branch and save return address', type: 'MRI' },
  ISZ: { mnemonic: 'ISZ', opcodeHex: '6', description: 'Increment and skip if zero', type: 'MRI' },
  CLA: { mnemonic: 'CLA', opcodeHex: '7800', description: 'Clear AC', type: 'RRI' },
  CLE: { mnemonic: 'CLE', opcodeHex: '7400', description: 'Clear E', type: 'RRI' },
  CMA: { mnemonic: 'CMA', opcodeHex: '7200', description: 'Complement AC', type: 'RRI' },
  CME: { mnemonic: 'CME', opcodeHex: '7100', description: 'Complement E', type: 'RRI' },
  CIR: { mnemonic: 'CIR', opcodeHex: '7080', description: 'Circulate right AC and E', type: 'RRI' },
  CIL: { mnemonic: 'CIL', opcodeHex: '7040', description: 'Circulate left AC and E', type: 'RRI' },
  INC: { mnemonic: 'INC', opcodeHex: '7020', description: 'Increment AC', type: 'RRI' },
  SPA: { mnemonic: 'SPA', opcodeHex: '7010', description: 'Skip if AC positive', type: 'RRI' },
  SNA: { mnemonic: 'SNA', opcodeHex: '7008', description: 'Skip if AC negative', type: 'RRI' },
  SZA: { mnemonic: 'SZA', opcodeHex: '7004', description: 'Skip if AC is zero', type: 'RRI' },
  SZE: { mnemonic: 'SZE', opcodeHex: '7002', description: 'Skip if E is zero', type: 'RRI' },
  HLT: { mnemonic: 'HLT', opcodeHex: '7001', description: 'Halt computer', type: 'RRI' },
};

/**
 * Creates initial clean CPU state
 */
export function createInitialCpuState(): { registers: CpuRegisters; memory: Uint16Array } {
  const memory = new Uint16Array(4096);
  const registers: CpuRegisters = {
    PC: 0x100, // Program Counter starts at address 0x100
    AR: 0x000,
    DR: 0x0000,
    AC: 0x0000,
    IR: 0x0000,
    TR: 0x0000,
    INPR: 0x00,
    OUTR: 0x00,
    E: 0,
    I: 0,
    SC: 0,
  };
  return { registers, memory };
}

/**
 * Encodes an assembly instruction into 16-bit machine code
 */
export function assembleInstruction(mnemonic: string, address: number = 0, indirect: boolean = false): number {
  const m = mnemonic.toUpperCase().trim();
  const info = INSTRUCTION_SET[m];
  if (!info) return 0x7001; // Default to HLT

  if (info.type === 'MRI') {
    const opcode = parseInt(info.opcodeHex, 16);
    const iBit = indirect ? 0x8000 : 0x0000;
    const opBits = (opcode & 0x7) << 12;
    const addrBits = address & 0x0fff;
    return iBit | opBits | addrBits;
  } else {
    return parseInt(info.opcodeHex, 16);
  }
}

/**
 * Generates cycle-by-cycle micro-operations for an instruction execution
 */
export function executeInstructionStepByStep(
  initialRegisters: CpuRegisters,
  memory: Uint16Array
): { steps: DatapathStep[]; finalRegisters: CpuRegisters } {
  const steps: DatapathStep[] = [];
  const reg: CpuRegisters = { ...initialRegisters };
  let stepIndex = 0;

  // Helper to push step
  const pushStep = (
    phase: DatapathStep['phase'],
    timing: string,
    microOp: string,
    busSource: BusSource,
    busSelector: string,
    busVal: number,
    signals: string[],
    explanation: string,
    extra: Partial<DatapathStep> = {}
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      phase,
      timingSignal: timing,
      microOperation: microOp,
      busSource,
      busSelector,
      busValueHex: '0x' + (busVal & 0xffff).toString(16).toUpperCase().padStart(4, '0'),
      activeControlSignals: signals,
      registers: { ...reg },
      explanation,
      isInstructionComplete: false,
      ...extra,
    });
  };

  // --- FETCH PHASE ---
  // T0: AR <- PC
  reg.SC = 0;
  reg.AR = reg.PC;
  pushStep(
    'FETCH',
    'T0',
    'AR ← PC',
    'PC',
    '010',
    reg.PC,
    ['LD_AR', 'S1'],
    `Fetch: Address of instruction in PC (0x${reg.PC.toString(16).toUpperCase()}) is transferred via Common Bus to AR.`
  );

  // T1: IR <- M[AR], PC <- PC + 1
  reg.SC = 1;
  const fetchedIR = memory[reg.AR] || 0;
  reg.IR = fetchedIR;
  reg.PC = (reg.PC + 1) & 0x0fff;
  pushStep(
    'FETCH',
    'T1',
    'IR ← M[AR], PC ← PC + 1',
    'MEMORY',
    '111',
    fetchedIR,
    ['READ', 'LD_IR', 'INR_PC', 'S0', 'S1', 'S2'],
    `Fetch: Memory at address 0x${reg.AR.toString(16).toUpperCase()} is read into IR (0x${fetchedIR.toString(16).padStart(4, '0').toUpperCase()}). PC is incremented to 0x${reg.PC.toString(16).toUpperCase()}.`,
    { memoryRead: true, activeMemoryAddress: reg.AR }
  );

  // --- DECODE PHASE ---
  // T2: D0..D7 <- Decode IR(12-14), AR <- IR(0-11), I <- IR(15)
  reg.SC = 2;
  const opcode = (reg.IR >> 12) & 0x7;
  const isDirectOrIndirect = (reg.IR >> 15) & 0x1;
  reg.I = isDirectOrIndirect;
  reg.AR = reg.IR & 0x0fff;
  const isMRI = opcode < 7;
  const isRRI = opcode === 7 && reg.I === 0;

  pushStep(
    'DECODE',
    'T2',
    'Decode IR(12-14), AR ← IR(0-11), I ← IR(15)',
    'IR',
    '101',
    reg.AR,
    ['LD_AR', 'S0', 'S2'],
    `Decode: Opcode ${opcode} decoded. Address field 0x${reg.AR.toString(16).toUpperCase()} loaded into AR. Addressing Mode I = ${reg.I} (${reg.I === 0 ? 'Direct' : 'Indirect'}).`
  );

  // --- INDIRECT PHASE (If MRI and I == 1) ---
  if (isMRI && reg.I === 1) {
    reg.SC = 3;
    const effectiveAddr = memory[reg.AR] & 0x0fff;
    reg.AR = effectiveAddr;
    pushStep(
      'INDIRECT',
      'T3',
      'AR ← M[AR]',
      'MEMORY',
      '111',
      effectiveAddr,
      ['READ', 'LD_AR', 'S0', 'S1', 'S2'],
      `Indirect Address Resolution: Read pointer at address to obtain Effective Address (EA = 0x${effectiveAddr.toString(16).toUpperCase()}) loaded into AR.`,
      { memoryRead: true, activeMemoryAddress: reg.AR }
    );
  }

  // --- EXECUTE PHASE ---
  if (isMRI) {
    // Memory Reference Instructions
    switch (opcode) {
      case 0: { // AND
        reg.SC = 4;
        reg.DR = memory[reg.AR] || 0;
        pushStep(
          'EXECUTE',
          'T4',
          'DR ← M[AR]',
          'MEMORY',
          '111',
          reg.DR,
          ['READ', 'LD_DR', 'S0', 'S1', 'S2'],
          `AND Execute (T4): Read operand from memory 0x${reg.AR.toString(16).toUpperCase()} into DR (0x${reg.DR.toString(16).toUpperCase()}).`,
          { memoryRead: true, activeMemoryAddress: reg.AR }
        );

        reg.SC = 5;
        reg.AC = (reg.AC & reg.DR) & 0xffff;
        reg.SC = 0;
        pushStep(
          'EXECUTE',
          'T5',
          'AC ← AC ∧ DR, SC ← 0',
          'NONE',
          '000',
          reg.AC,
          ['CLR_SC', 'ALU_AND'],
          `AND Execute (T5): Bitwise AND performed between AC and DR. Result AC = 0x${reg.AC.toString(16).toUpperCase()}. Sequence counter cleared.`
        );
        break;
      }
      case 1: { // ADD
        reg.SC = 4;
        reg.DR = memory[reg.AR] || 0;
        pushStep(
          'EXECUTE',
          'T4',
          'DR ← M[AR]',
          'MEMORY',
          '111',
          reg.DR,
          ['READ', 'LD_DR', 'S0', 'S1', 'S2'],
          `ADD Execute (T4): Read operand from memory 0x${reg.AR.toString(16).toUpperCase()} into DR (0x${reg.DR.toString(16).toUpperCase()}).`,
          { memoryRead: true, activeMemoryAddress: reg.AR }
        );

        reg.SC = 5;
        const sum = reg.AC + reg.DR;
        reg.E = sum > 0xffff ? 1 : 0;
        reg.AC = sum & 0xffff;
        reg.SC = 0;
        pushStep(
          'EXECUTE',
          'T5',
          'AC ← AC + DR, E ← Cout, SC ← 0',
          'NONE',
          '000',
          reg.AC,
          ['CLR_SC', 'ALU_ADD', 'LD_AC'],
          `ADD Execute (T5): Binary addition AC + DR. AC = 0x${reg.AC.toString(16).toUpperCase()}, Carry bit E = ${reg.E}. Sequence counter cleared.`
        );
        break;
      }
      case 2: { // LDA
        reg.SC = 4;
        reg.DR = memory[reg.AR] || 0;
        pushStep(
          'EXECUTE',
          'T4',
          'DR ← M[AR]',
          'MEMORY',
          '111',
          reg.DR,
          ['READ', 'LD_DR', 'S0', 'S1', 'S2'],
          `LDA Execute (T4): Read memory word 0x${reg.AR.toString(16).toUpperCase()} into DR (0x${reg.DR.toString(16).toUpperCase()}).`,
          { memoryRead: true, activeMemoryAddress: reg.AR }
        );

        reg.SC = 5;
        reg.AC = reg.DR;
        reg.SC = 0;
        pushStep(
          'EXECUTE',
          'T5',
          'AC ← DR, SC ← 0',
          'DR',
          '011',
          reg.AC,
          ['LD_AC', 'S0', 'S1', 'CLR_SC'],
          `LDA Execute (T5): DR content transferred to AC (0x${reg.AC.toString(16).toUpperCase()}). Sequence counter cleared.`
        );
        break;
      }
      case 3: { // STA
        reg.SC = 4;
        memory[reg.AR] = reg.AC;
        reg.SC = 0;
        pushStep(
          'EXECUTE',
          'T4',
          'M[AR] ← AC, SC ← 0',
          'AC',
          '100',
          reg.AC,
          ['WRITE', 'S2', 'CLR_SC'],
          `STA Execute (T4): Accumulator value (0x${reg.AC.toString(16).toUpperCase()}) stored to memory at address 0x${reg.AR.toString(16).toUpperCase()}. Sequence counter cleared.`,
          { memoryWrite: true, activeMemoryAddress: reg.AR }
        );
        break;
      }
      case 4: { // BUN
        reg.SC = 4;
        reg.PC = reg.AR;
        reg.SC = 0;
        pushStep(
          'EXECUTE',
          'T4',
          'PC ← AR, SC ← 0',
          'AR',
          '001',
          reg.PC,
          ['LD_PC', 'S0', 'CLR_SC'],
          `BUN Execute (T4): Unconditional branch. PC updated to destination address 0x${reg.PC.toString(16).toUpperCase()}. Sequence counter cleared.`
        );
        break;
      }
      case 5: { // BSA
        reg.SC = 4;
        memory[reg.AR] = reg.PC;
        reg.AR = (reg.AR + 1) & 0x0fff;
        pushStep(
          'EXECUTE',
          'T4',
          'M[AR] ← PC, AR ← AR + 1',
          'PC',
          '010',
          reg.PC,
          ['WRITE', 'INR_AR', 'S1'],
          `BSA Execute (T4): Return address (0x${reg.PC.toString(16).toUpperCase()}) saved in memory. AR incremented to 0x${reg.AR.toString(16).toUpperCase()}.`,
          { memoryWrite: true, activeMemoryAddress: reg.AR - 1 }
        );

        reg.SC = 5;
        reg.PC = reg.AR;
        reg.SC = 0;
        pushStep(
          'EXECUTE',
          'T5',
          'PC ← AR, SC ← 0',
          'AR',
          '001',
          reg.PC,
          ['LD_PC', 'S0', 'CLR_SC'],
          `BSA Execute (T5): Subroutine execution starts at PC = 0x${reg.PC.toString(16).toUpperCase()}. Sequence counter cleared.`
        );
        break;
      }
      case 6: { // ISZ
        reg.SC = 4;
        reg.DR = memory[reg.AR] || 0;
        pushStep(
          'EXECUTE',
          'T4',
          'DR ← M[AR]',
          'MEMORY',
          '111',
          reg.DR,
          ['READ', 'LD_DR', 'S0', 'S1', 'S2'],
          `ISZ Execute (T4): Read operand from memory into DR (0x${reg.DR.toString(16).toUpperCase()}).`,
          { memoryRead: true, activeMemoryAddress: reg.AR }
        );

        reg.SC = 5;
        reg.DR = (reg.DR + 1) & 0xffff;
        pushStep(
          'EXECUTE',
          'T5',
          'DR ← DR + 1',
          'NONE',
          '000',
          reg.DR,
          ['INR_DR'],
          `ISZ Execute (T5): DR incremented to 0x${reg.DR.toString(16).toUpperCase()} (${reg.DR}).`
        );

        reg.SC = 6;
        memory[reg.AR] = reg.DR;
        if (reg.DR === 0) {
          reg.PC = (reg.PC + 1) & 0x0fff;
        }
        reg.SC = 0;
        pushStep(
          'EXECUTE',
          'T6',
          'M[AR] ← DR, if (DR = 0) PC ← PC + 1, SC ← 0',
          'DR',
          '011',
          reg.DR,
          ['WRITE', 'S0', 'S1', ...(reg.DR === 0 ? ['INR_PC'] : []), 'CLR_SC'],
          `ISZ Execute (T6): Write back DR to memory. ${reg.DR === 0 ? 'DR is zero ➔ Skipped next instruction (PC incremented)' : 'DR != 0 ➔ Next instruction not skipped'}.`,
          { memoryWrite: true, activeMemoryAddress: reg.AR }
        );
        break;
      }
    }
  } else if (isRRI) {
    // Register Reference Instructions (Executed at T3)
    reg.SC = 3;
    const rBits = reg.IR & 0x0fff;
    let desc = '';
    let signals: string[] = ['CLR_SC'];

    if (rBits & 0x0800) { reg.AC = 0; desc = 'CLA: Clear AC ← 0'; signals.push('CLR_AC'); }
    else if (rBits & 0x0400) { reg.E = 0; desc = 'CLE: Clear E ← 0'; signals.push('CLR_E'); }
    else if (rBits & 0x0200) { reg.AC = (~reg.AC) & 0xffff; desc = 'CMA: Complement AC ← ~AC'; signals.push('CMP_AC'); }
    else if (rBits & 0x0100) { reg.E = reg.E === 0 ? 1 : 0; desc = 'CME: Complement E ← ~E'; signals.push('CMP_E'); }
    else if (rBits & 0x0080) {
      const oldA0 = reg.AC & 1;
      reg.AC = ((reg.AC >> 1) | (reg.E << 15)) & 0xffff;
      reg.E = oldA0;
      desc = 'CIR: Circulate Right AC and E';
      signals.push('SHR_AC');
    } else if (rBits & 0x0040) {
      const oldA15 = (reg.AC >> 15) & 1;
      reg.AC = ((reg.AC << 1) | reg.E) & 0xffff;
      reg.E = oldA15;
      desc = 'CIL: Circulate Left AC and E';
      signals.push('SHL_AC');
    } else if (rBits & 0x0020) {
      reg.AC = (reg.AC + 1) & 0xffff;
      desc = 'INC: Increment AC ← AC + 1';
      signals.push('INR_AC');
    } else if (rBits & 0x0010) {
      if ((reg.AC & 0x8000) === 0) reg.PC = (reg.PC + 1) & 0x0fff;
      desc = 'SPA: Skip if AC is positive';
    } else if (rBits & 0x0008) {
      if ((reg.AC & 0x8000) !== 0) reg.PC = (reg.PC + 1) & 0x0fff;
      desc = 'SNA: Skip if AC is negative';
    } else if (rBits & 0x0004) {
      if (reg.AC === 0) reg.PC = (reg.PC + 1) & 0x0fff;
      desc = 'SZA: Skip if AC is zero';
    } else if (rBits & 0x0002) {
      if (reg.E === 0) reg.PC = (reg.PC + 1) & 0x0fff;
      desc = 'SZE: Skip if E is zero';
    } else if (rBits & 0x0001) {
      desc = 'HLT: Halt Computer';
    }

    reg.SC = 0;
    pushStep(
      rBits & 0x0001 ? 'HALTED' : 'EXECUTE',
      'T3',
      desc,
      'NONE',
      '000',
      reg.AC,
      signals,
      `Register-Reference Instruction executed in one micro-operation cycle: ${desc}.`
    );
  }

  // Mark final step
  if (steps.length > 0) {
    steps[steps.length - 1].isInstructionComplete = true;
  }

  return { steps, finalRegisters: reg };
}
