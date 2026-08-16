import { describe, it, expect } from 'vitest';
import { convertNumberSystems, generateComplementSteps, computeRadixComplements } from './numberSystems.ts';

describe('Number Systems & Complement Sandbox Engine', () => {
  it('converts positive numbers across radixes', () => {
    const res = convertNumberSystems(42, 8);
    expect(res.binary).toBe('00101010');
    expect(res.octal).toBe('52');
    expect(res.hexadecimal).toBe('2A');
    expect(res.isNegative).toBe(false);
    expect(res.signedValue).toBe(42);
  });

  it('computes 1\'s and 2\'s complement for negative numbers', () => {
    // -5 in 8 bits: +5 is 00000101 -> 1's comp: 11111010 -> 2's comp: 11111011
    const res = convertNumberSystems(-5, 8);
    expect(res.isNegative).toBe(true);
    expect(res.onesComplement).toBe('11111010');
    expect(res.twosComplement).toBe('11111011');
    expect(res.signedValue).toBe(-5);
  });

  it('generates step-by-step complement instructions', () => {
    const steps = generateComplementSteps(-18, 8);
    expect(steps.inputDecimal).toBe(-18);
    expect(steps.originalBinary).toBe('00010010'); // 18 in binary
    expect(steps.invertedBits).toBe('11101101');   // Inverted
    expect(steps.twosComplementBits).toBe('11101110'); // + 1
    expect(steps.steps.length).toBe(4);
  });

  it('computes generalized radix complements (10\'s complement of decimal)', () => {
    const res = computeRadixComplements('4250', 10, 4);
    // 9's complement of 4250 is 5749
    expect(res.diminishedComplement).toBe('5749');
    // 10's complement is 5750
    expect(res.radixComplement).toBe('5750');
  });
});
