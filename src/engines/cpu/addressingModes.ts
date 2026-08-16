/**
 * Addressing Modes Interactive Lab Engine
 */

export type AddressingModeType =
  | 'IMMEDIATE'
  | 'DIRECT'
  | 'INDIRECT'
  | 'REGISTER'
  | 'REGISTER_INDIRECT'
  | 'INDEXED'
  | 'RELATIVE'
  | 'AUTO_INCREMENT'
  | 'AUTO_DECREMENT';

export interface AddressingModeStep {
  stepIndex: number;
  stage: 'INSTRUCTION_DECODE' | 'EA_CALCULATION' | 'OPERAND_FETCH' | 'COMPLETE';
  description: string;
  formula: string;
  effectiveAddress?: number;
  operandValue: number;
  memoryHighlighted?: number[];
  registersHighlighted?: string[];
  explanation: string;
}

export interface AddressingModeResult {
  mode: AddressingModeType;
  modeName: string;
  syntax: string;
  addressField: number;
  pcValue: number;
  indexRegisterValue: number;
  generalRegisterValue: number;
  effectiveAddress: number | null; // null for Immediate/Register
  operandValue: number;
  memoryAccessCount: number;
  steps: AddressingModeStep[];
  memoryMap: { address: number; value: number; label?: string }[];
}

export function evaluateAddressingMode(
  mode: AddressingModeType,
  addressField: number = 300,
  pc: number = 100,
  ix: number = 50,
  r1: number = 400
): AddressingModeResult {
  // Pre-configured memory map
  const memoryMap: Record<number, number> = {
    100: 0x212c, // Next instruction
    200: 500,
    300: 600,   // M[300] = 600 (Pointer for Indirect)
    350: 999,   // M[300 + 50] = 999 (For Indexed)
    400: 750,   // M[400] = 750 (For Register Indirect)
    450: 1234,  // M[350 + 100] (For Relative)
    600: 888,   // M[600] = 888 (Destination for Indirect)
  };

  const steps: AddressingModeStep[] = [];
  let effectiveAddress: number | null = null;
  let operandValue = 0;
  let memoryAccessCount = 0;
  let syntax = '';
  let modeName = '';

  switch (mode) {
    case 'IMMEDIATE':
      modeName = 'Immediate Addressing';
      syntax = `ADD #${addressField}`;
      operandValue = addressField;
      memoryAccessCount = 0;

      steps.push({
        stepIndex: 0,
        stage: 'INSTRUCTION_DECODE',
        description: 'Read Address/Operand field from Instruction',
        formula: 'Operand = AddressField',
        operandValue,
        explanation: `In Immediate mode, the operand itself is stored directly in the address field (${addressField}). No memory reference is required.`,
      });
      steps.push({
        stepIndex: 1,
        stage: 'OPERAND_FETCH',
        description: 'Operand loaded into ALU immediately',
        formula: `Operand = ${addressField}`,
        operandValue,
        explanation: `Operand ${operandValue} is transferred directly from IR to ALU/Accumulator. Effective Address is not applicable.`,
      });
      break;

    case 'DIRECT':
      modeName = 'Direct Addressing';
      syntax = `ADD ${addressField}`;
      effectiveAddress = addressField;
      operandValue = memoryMap[effectiveAddress] ?? 600;
      memoryAccessCount = 1;

      steps.push({
        stepIndex: 0,
        stage: 'INSTRUCTION_DECODE',
        description: 'Address field contains Effective Address directly',
        formula: `EA = AddressField = ${addressField}`,
        effectiveAddress,
        operandValue: 0,
        registersHighlighted: ['IR'],
        explanation: `Instruction provides the actual memory address where the operand is stored: EA = ${addressField}.`,
      });
      steps.push({
        stepIndex: 1,
        stage: 'EA_CALCULATION',
        description: 'Load AR with Effective Address',
        formula: `AR ← ${effectiveAddress}`,
        effectiveAddress,
        operandValue: 0,
        registersHighlighted: ['AR'],
        memoryHighlighted: [effectiveAddress],
        explanation: `Memory Address Register (AR) is loaded with EA = ${effectiveAddress}.`,
      });
      steps.push({
        stepIndex: 2,
        stage: 'OPERAND_FETCH',
        description: 'Read operand from Memory[EA]',
        formula: `Operand = M[${effectiveAddress}] = ${operandValue}`,
        effectiveAddress,
        operandValue,
        memoryHighlighted: [effectiveAddress],
        explanation: `Operand ${operandValue} is fetched from memory location ${effectiveAddress}. Requires 1 Memory Access.`,
      });
      break;

    case 'INDIRECT':
      modeName = 'Indirect Addressing';
      syntax = `ADD @${addressField}`;
      const pointerAddress = addressField;
      effectiveAddress = memoryMap[pointerAddress] ?? 600;
      operandValue = memoryMap[effectiveAddress] ?? 888;
      memoryAccessCount = 2;

      steps.push({
        stepIndex: 0,
        stage: 'INSTRUCTION_DECODE',
        description: 'Address field holds pointer to Effective Address',
        formula: `Pointer Address = ${pointerAddress}`,
        registersHighlighted: ['IR'],
        operandValue: 0,
        explanation: `The instruction address field (${pointerAddress}) stores the address of the operand's address (pointer).`,
      });
      steps.push({
        stepIndex: 1,
        stage: 'EA_CALCULATION',
        description: '1st Memory Read: Fetch Effective Address from Memory[Pointer]',
        formula: `EA = M[${pointerAddress}] = ${effectiveAddress}`,
        effectiveAddress,
        operandValue: 0,
        memoryHighlighted: [pointerAddress],
        explanation: `Reading memory location ${pointerAddress} returns Effective Address = ${effectiveAddress}.`,
      });
      steps.push({
        stepIndex: 2,
        stage: 'OPERAND_FETCH',
        description: '2nd Memory Read: Fetch Operand from Memory[EA]',
        formula: `Operand = M[${effectiveAddress}] = ${operandValue}`,
        effectiveAddress,
        operandValue,
        memoryHighlighted: [pointerAddress, effectiveAddress],
        explanation: `Operand ${operandValue} is fetched from Effective Address ${effectiveAddress}. Requires 2 Memory Accesses.`,
      });
      break;

    case 'REGISTER':
      modeName = 'Register Addressing';
      syntax = 'ADD R1';
      operandValue = r1;
      memoryAccessCount = 0;

      steps.push({
        stepIndex: 0,
        stage: 'INSTRUCTION_DECODE',
        description: 'Register field specifies CPU register R1',
        formula: 'Operand = Register R1',
        operandValue,
        registersHighlighted: ['R1'],
        explanation: `The operand resides directly in CPU register R1. No memory access is needed.`,
      });
      steps.push({
        stepIndex: 1,
        stage: 'OPERAND_FETCH',
        description: 'Read operand value from R1',
        formula: `Operand = R1 = ${operandValue}`,
        operandValue,
        registersHighlighted: ['R1'],
        explanation: `Fastest execution: Operand ${operandValue} retrieved directly from internal CPU register R1.`,
      });
      break;

    case 'REGISTER_INDIRECT':
      modeName = 'Register Indirect Addressing';
      syntax = 'ADD (R1)';
      effectiveAddress = r1;
      operandValue = memoryMap[effectiveAddress] ?? 750;
      memoryAccessCount = 1;

      steps.push({
        stepIndex: 0,
        stage: 'INSTRUCTION_DECODE',
        description: 'Register R1 contains the Effective Address',
        formula: `EA = [R1] = ${effectiveAddress}`,
        effectiveAddress,
        operandValue: 0,
        registersHighlighted: ['R1'],
        explanation: `Register R1 holds the memory address (EA = ${effectiveAddress}) where the operand is stored.`,
      });
      steps.push({
        stepIndex: 1,
        stage: 'OPERAND_FETCH',
        description: 'Fetch operand from Memory[R1]',
        formula: `Operand = M[${effectiveAddress}] = ${operandValue}`,
        effectiveAddress,
        operandValue,
        registersHighlighted: ['R1'],
        memoryHighlighted: [effectiveAddress],
        explanation: `Memory location ${effectiveAddress} (pointed to by R1) is read to retrieve operand ${operandValue}. Requires 1 Memory Access.`,
      });
      break;

    case 'INDEXED':
      modeName = 'Indexed Addressing';
      syntax = `ADD ${addressField}(IX)`;
      effectiveAddress = addressField + ix;
      operandValue = memoryMap[effectiveAddress] ?? 999;
      memoryAccessCount = 1;

      steps.push({
        stepIndex: 0,
        stage: 'INSTRUCTION_DECODE',
        description: 'Combine Base Address Field and Index Register IX',
        formula: `Base Address = ${addressField}, IX = ${ix}`,
        operandValue: 0,
        registersHighlighted: ['IR', 'IX'],
        explanation: `Indexed addressing is commonly used for arrays. EA = Base Address + Index Register.`,
      });
      steps.push({
        stepIndex: 1,
        stage: 'EA_CALCULATION',
        description: 'Compute Effective Address = AddressField + IX',
        formula: `EA = ${addressField} + ${ix} = ${effectiveAddress}`,
        effectiveAddress,
        operandValue: 0,
        registersHighlighted: ['IX'],
        explanation: `ALU calculates Effective Address: ${addressField} + ${ix} = ${effectiveAddress}.`,
      });
      steps.push({
        stepIndex: 2,
        stage: 'OPERAND_FETCH',
        description: 'Fetch operand from Memory[EA]',
        formula: `Operand = M[${effectiveAddress}] = ${operandValue}`,
        effectiveAddress,
        operandValue,
        memoryHighlighted: [effectiveAddress],
        explanation: `Operand ${operandValue} fetched from memory index ${effectiveAddress}. Requires 1 Memory Access.`,
      });
      break;

    case 'RELATIVE':
      modeName = 'Relative Addressing (PC-Relative)';
      syntax = `ADD $ + ${addressField}`;
      effectiveAddress = pc + addressField;
      operandValue = memoryMap[effectiveAddress] ?? 1234;
      memoryAccessCount = 1;

      steps.push({
        stepIndex: 0,
        stage: 'INSTRUCTION_DECODE',
        description: 'Offset is relative to Program Counter PC',
        formula: `PC = ${pc}, Offset = ${addressField}`,
        operandValue: 0,
        registersHighlighted: ['PC', 'IR'],
        explanation: `Relative addressing calculates address relative to current Program Counter (PC = ${pc}). Commonly used in branch/jump instructions.`,
      });
      steps.push({
        stepIndex: 1,
        stage: 'EA_CALCULATION',
        description: 'Compute Effective Address = PC + Offset',
        formula: `EA = ${pc} + ${addressField} = ${effectiveAddress}`,
        effectiveAddress,
        operandValue: 0,
        registersHighlighted: ['PC'],
        explanation: `Effective Address calculated as PC (${pc}) + Offset (${addressField}) = ${effectiveAddress}.`,
      });
      steps.push({
        stepIndex: 2,
        stage: 'OPERAND_FETCH',
        description: 'Fetch operand from Memory[EA]',
        formula: `Operand = M[${effectiveAddress}] = ${operandValue}`,
        effectiveAddress,
        operandValue,
        memoryHighlighted: [effectiveAddress],
        explanation: `Operand ${operandValue} fetched from memory location ${effectiveAddress}. Requires 1 Memory Access.`,
      });
      break;

    default:
      modeName = mode;
      syntax = 'ADD';
  }

  // Formatted memory map list for UI
  const displayMemory = [
    { address: 100, value: memoryMap[100] ?? 0, label: 'PC (Instruction Address)' },
    { address: 200, value: memoryMap[200] ?? 0 },
    { address: 300, value: memoryMap[300] ?? 0, label: 'Address Field (Pointer)' },
    { address: 350, value: memoryMap[350] ?? 0, label: 'Indexed EA (300+50)' },
    { address: 400, value: memoryMap[400] ?? 0, label: 'Register R1 Pointer' },
    { address: 450, value: memoryMap[450] ?? 0, label: 'Relative EA (100+350)' },
    { address: 600, value: memoryMap[600] ?? 0, label: 'Indirect Target EA' },
  ];

  return {
    mode,
    modeName,
    syntax,
    addressField,
    pcValue: pc,
    indexRegisterValue: ix,
    generalRegisterValue: r1,
    effectiveAddress,
    operandValue,
    memoryAccessCount,
    steps,
    memoryMap: displayMemory,
  };
}
