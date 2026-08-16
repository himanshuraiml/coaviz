import { describe, it, expect } from 'vitest';
import { generateBoothSteps, toTwosComplement, fromTwosComplement } from './booth.ts';

describe("Booth's Multiplication Engine", () => {
  it('converts to and from two\'s complement correctly', () => {
    expect(toTwosComplement(7, 4)).toBe('0111');
    expect(toTwosComplement(-7, 4)).toBe('1001');
    expect(toTwosComplement(3, 4)).toBe('0011');
    expect(toTwosComplement(-3, 4)).toBe('1101');
    expect(toTwosComplement(0, 4)).toBe('0000');

    expect(fromTwosComplement('0111')).toBe(7);
    expect(fromTwosComplement('1001')).toBe(-7);
    expect(fromTwosComplement('0011')).toBe(3);
    expect(fromTwosComplement('1101')).toBe(-3);
  });

  it('multiplies positive × positive (7 × 3 = 21)', () => {
    const result = generateBoothSteps(7, 3, 5);
    expect(result.isValid).toBe(true);
    expect(result.finalProductDecimal).toBe(21);
    expect(result.steps.length).toBeGreaterThan(5);
  });

  it('multiplies positive × negative (7 × -3 = -21)', () => {
    const result = generateBoothSteps(7, -3, 5);
    expect(result.isValid).toBe(true);
    expect(result.finalProductDecimal).toBe(-21);
  });

  it('multiplies negative × positive (-7 × 3 = -21)', () => {
    const result = generateBoothSteps(-7, 3, 5);
    expect(result.isValid).toBe(true);
    expect(result.finalProductDecimal).toBe(-21);
  });

  it('multiplies negative × negative (-7 × -3 = 21)', () => {
    const result = generateBoothSteps(-7, -3, 5);
    expect(result.isValid).toBe(true);
    expect(result.finalProductDecimal).toBe(21);
  });

  it('multiplies by zero (0 × -5 = 0, 5 × 0 = 0)', () => {
    const res1 = generateBoothSteps(0, -5, 5);
    expect(res1.finalProductDecimal).toBe(0);

    const res2 = generateBoothSteps(5, 0, 5);
    expect(res2.finalProductDecimal).toBe(0);
  });

  it('handles standard 4-bit textbook case (7 × 3)', () => {
    const result = generateBoothSteps(7, 3, 4);
    expect(result.isValid).toBe(true);
    expect(result.finalProductDecimal).toBe(21);
  });
});
