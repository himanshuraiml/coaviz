import { describe, it, expect } from 'vitest';
import { floatToSingleIEEE754, floatToDoubleIEEE754, parseIEEE754Bits } from './ieee754.ts';

describe('IEEE 754 Converter Engine', () => {
  it('converts +1.0 to single-precision float (0x3F800000)', () => {
    const res = floatToSingleIEEE754(1.0);
    expect(res.signBit).toBe('0');
    expect(res.exponentBits).toBe('01111111'); // 127
    expect(res.exponentRaw).toBe(127);
    expect(res.exponentUnbiased).toBe(0);
    expect(res.mantissaBits).toBe('0'.repeat(23));
    expect(res.classification).toBe('NORMAL');
    expect(res.decimalValue).toBe(1.0);
  });

  it('converts -1.0 to single-precision float (0xBF800000)', () => {
    const res = floatToSingleIEEE754(-1.0);
    expect(res.signBit).toBe('1');
    expect(res.exponentBits).toBe('01111111');
    expect(res.decimalValue).toBe(-1.0);
  });

  it('converts standard float 13.625 to IEEE-754 single precision', () => {
    // 13.625 = 1101.101_2 = 1.101101_2 * 2^3
    // Exp = 3 + 127 = 130 = 10000010_2
    // Mantissa = 10110100000000000000000
    const res = floatToSingleIEEE754(13.625);
    expect(res.signBit).toBe('0');
    expect(res.exponentRaw).toBe(130);
    expect(res.exponentUnbiased).toBe(3);
    expect(res.mantissaBits.startsWith('101101')).toBe(true);
    expect(res.decimalValue).toBeCloseTo(13.625, 5);
  });

  it('identifies Positive and Negative Zero', () => {
    const posZero = parseIEEE754Bits('0', '00000000', '0'.repeat(23), 'single');
    expect(posZero.classification).toBe('ZERO_POSITIVE');
    expect(posZero.decimalValue).toBe(0);

    const negZero = parseIEEE754Bits('1', '00000000', '0'.repeat(23), 'single');
    expect(negZero.classification).toBe('ZERO_NEGATIVE');
  });

  it('identifies Positive and Negative Infinity', () => {
    const posInf = parseIEEE754Bits('0', '11111111', '0'.repeat(23), 'single');
    expect(posInf.classification).toBe('INFINITY_POSITIVE');
    expect(posInf.decimalValue).toBe(Infinity);

    const negInf = parseIEEE754Bits('1', '11111111', '0'.repeat(23), 'single');
    expect(negInf.classification).toBe('INFINITY_NEGATIVE');
    expect(negInf.decimalValue).toBe(-Infinity);
  });

  it('identifies NaN (Not a Number)', () => {
    const nanRes = parseIEEE754Bits('0', '11111111', '1' + '0'.repeat(22), 'single');
    expect(nanRes.classification).toBe('NAN');
    expect(Number.isNaN(nanRes.decimalValue)).toBe(true);
  });

  it('handles 64-bit double precision', () => {
    const dRes = floatToDoubleIEEE754(1.0);
    expect(dRes.precision).toBe('double');
    expect(dRes.totalBits).toBe(64);
    expect(dRes.exponentBits).toBe('01111111111'); // 1023
    expect(dRes.decimalValue).toBe(1.0);
  });
});
