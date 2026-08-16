import { describe, it, expect } from 'vitest';
import { evaluateAddressingMode } from './addressingModes.ts';

describe('Addressing Modes Engine', () => {
  it('evaluates Immediate Addressing (EA=null, Operand=300, 0 Memory References)', () => {
    const res = evaluateAddressingMode('IMMEDIATE', 300);
    expect(res.mode).toBe('IMMEDIATE');
    expect(res.effectiveAddress).toBeNull();
    expect(res.operandValue).toBe(300);
    expect(res.memoryAccessCount).toBe(0);
  });

  it('evaluates Direct Addressing (EA=300, Operand=600, 1 Memory Reference)', () => {
    const res = evaluateAddressingMode('DIRECT', 300);
    expect(res.effectiveAddress).toBe(300);
    expect(res.operandValue).toBe(600);
    expect(res.memoryAccessCount).toBe(1);
  });

  it('evaluates Indirect Addressing (EA=600, Operand=888, 2 Memory References)', () => {
    const res = evaluateAddressingMode('INDIRECT', 300);
    expect(res.effectiveAddress).toBe(600);
    expect(res.operandValue).toBe(888);
    expect(res.memoryAccessCount).toBe(2);
  });

  it('evaluates Register Addressing (Operand=400, 0 Memory References)', () => {
    const res = evaluateAddressingMode('REGISTER', 300, 100, 50, 400);
    expect(res.effectiveAddress).toBeNull();
    expect(res.operandValue).toBe(400);
    expect(res.memoryAccessCount).toBe(0);
  });

  it('evaluates Register Indirect Addressing (EA=400, Operand=750, 1 Memory Reference)', () => {
    const res = evaluateAddressingMode('REGISTER_INDIRECT', 300, 100, 50, 400);
    expect(res.effectiveAddress).toBe(400);
    expect(res.operandValue).toBe(750);
    expect(res.memoryAccessCount).toBe(1);
  });

  it('evaluates Indexed Addressing (EA=300+50=350, Operand=999, 1 Memory Reference)', () => {
    const res = evaluateAddressingMode('INDEXED', 300, 100, 50);
    expect(res.effectiveAddress).toBe(350);
    expect(res.operandValue).toBe(999);
    expect(res.memoryAccessCount).toBe(1);
  });

  it('evaluates Relative Addressing (EA=100+350=450, Operand=1234, 1 Memory Reference)', () => {
    const res = evaluateAddressingMode('RELATIVE', 350, 100);
    expect(res.effectiveAddress).toBe(450);
    expect(res.operandValue).toBe(1234);
    expect(res.memoryAccessCount).toBe(1);
  });
});
