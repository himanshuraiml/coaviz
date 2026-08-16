import { describe, it, expect } from 'vitest';
import {
  createInitialCpuState,
  assembleInstruction,
  executeInstructionStepByStep,
} from './datapath.ts';

describe('Mano Basic Computer Datapath Engine', () => {
  it('initializes CPU registers cleanly', () => {
    const { registers } = createInitialCpuState();
    expect(registers.PC).toBe(0x100);
    expect(registers.AC).toBe(0);
    expect(registers.AR).toBe(0);
    expect(registers.SC).toBe(0);
  });

  it('assembles and executes CLA (Clear AC)', () => {
    const { registers, memory } = createInitialCpuState();
    registers.AC = 0x1234;
    memory[0x100] = assembleInstruction('CLA'); // 0x7800

    const { steps, finalRegisters } = executeInstructionStepByStep(registers, memory);
    expect(steps.length).toBeGreaterThan(2);
    expect(steps[0].timingSignal).toBe('T0');
    expect(steps[1].timingSignal).toBe('T1');
    expect(steps[2].timingSignal).toBe('T2');
    expect(steps[3].timingSignal).toBe('T3');
    expect(finalRegisters.AC).toBe(0);
  });

  it('assembles and executes INC (Increment AC)', () => {
    const { registers, memory } = createInitialCpuState();
    registers.AC = 0x000F;
    memory[0x100] = assembleInstruction('INC'); // 0x7020

    const { finalRegisters } = executeInstructionStepByStep(registers, memory);
    expect(finalRegisters.AC).toBe(0x0010);
  });

  it('assembles and executes LDA (Direct Load Accumulator)', () => {
    const { registers, memory } = createInitialCpuState();
    memory[0x200] = 0xABCD; // Data at 0x200
    memory[0x100] = assembleInstruction('LDA', 0x200, false); // 0x2200

    const { steps, finalRegisters } = executeInstructionStepByStep(registers, memory);
    expect(finalRegisters.AC).toBe(0xABCD);
    expect(steps.some(s => s.timingSignal === 'T4')).toBe(true);
    expect(steps.some(s => s.timingSignal === 'T5')).toBe(true);
  });

  it('assembles and executes ADD (Direct Add)', () => {
    const { registers, memory } = createInitialCpuState();
    registers.AC = 0x0010;
    memory[0x300] = 0x0020; // Data at 0x300
    memory[0x100] = assembleInstruction('ADD', 0x300, false); // 0x1300

    const { finalRegisters } = executeInstructionStepByStep(registers, memory);
    expect(finalRegisters.AC).toBe(0x0030);
  });

  it('executes Indirect Addressing (LDA @0x200 -> 0x300 -> 0x5555)', () => {
    const { registers, memory } = createInitialCpuState();
    memory[0x200] = 0x0300; // Pointer at 0x200
    memory[0x300] = 0x5555; // Target data at 0x300
    memory[0x100] = assembleInstruction('LDA', 0x200, true); // Indirect bit set (I=1)

    const { steps, finalRegisters } = executeInstructionStepByStep(registers, memory);
    expect(steps.some(s => s.timingSignal === 'T3' && s.phase === 'INDIRECT')).toBe(true);
    expect(finalRegisters.AC).toBe(0x5555);
  });

  it('executes BUN (Branch Unconditionally)', () => {
    const { registers, memory } = createInitialCpuState();
    memory[0x100] = assembleInstruction('BUN', 0x450, false); // 0x4450

    const { finalRegisters } = executeInstructionStepByStep(registers, memory);
    expect(finalRegisters.PC).toBe(0x450);
  });
});
