/**
 * IEEE 754 Floating Point Converter & Visualizer Engine
 */

export type PrecisionMode = 'single' | 'double';

export type FloatClassification =
  | 'NORMAL'
  | 'SUBNORMAL'
  | 'ZERO_POSITIVE'
  | 'ZERO_NEGATIVE'
  | 'INFINITY_POSITIVE'
  | 'INFINITY_NEGATIVE'
  | 'NAN';

export interface IEEE754Decomposition {
  precision: PrecisionMode;
  totalBits: number;
  signBit: string;
  signDecimal: number;
  exponentBits: string;
  exponentRaw: number;
  exponentUnbiased: number;
  bias: number;
  mantissaBits: string;
  mantissaFraction: number; // 0.xxx
  implicitBit: number; // 1 for normal, 0 for subnormal/zero
  classification: FloatClassification;
  decimalValue: number;
  formulaDisplay: string;
  stepsExplanation: string[];
  hexString: string;
  fullBinary: string;
}

/**
 * Packs a 32-bit single-precision float into an IEEE 754 decomposition
 */
export function floatToSingleIEEE754(val: number): IEEE754Decomposition {
  const buffer = new ArrayBuffer(4);
  const float32 = new Float32Array(buffer);
  const uint32 = new Uint32Array(buffer);

  float32[0] = val;
  const bits = uint32[0];
  const binary32 = (bits >>> 0).toString(2).padStart(32, '0');

  const signBit = binary32[0];
  const exponentBits = binary32.slice(1, 9);
  const mantissaBits = binary32.slice(9, 32);

  return parseIEEE754Bits(signBit, exponentBits, mantissaBits, 'single');
}

/**
 * Packs a 64-bit double-precision float into an IEEE 754 decomposition
 */
export function floatToDoubleIEEE754(val: number): IEEE754Decomposition {
  const buffer = new ArrayBuffer(8);
  const float64 = new Float64Array(buffer);
  const uint8 = new Uint8Array(buffer);

  float64[0] = val;

  // Read 64 bits in big-endian order
  let binary64 = '';
  // Check system endianness
  const isLittleEndian = new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;
  const indices = isLittleEndian ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  for (const idx of indices) {
    binary64 += uint8[idx].toString(2).padStart(8, '0');
  }

  const signBit = binary64[0];
  const exponentBits = binary64.slice(1, 12);
  const mantissaBits = binary64.slice(12, 64);

  return parseIEEE754Bits(signBit, exponentBits, mantissaBits, 'double');
}

/**
 * Parses individual sign, exponent, and mantissa bit strings into IEEE754Decomposition
 */
export function parseIEEE754Bits(
  signBit: string,
  exponentBits: string,
  mantissaBits: string,
  precision: PrecisionMode = 'single'
): IEEE754Decomposition {
  const isSingle = precision === 'single';
  const totalBits = isSingle ? 32 : 64;
  const expBitLength = isSingle ? 8 : 11;
  const manBitLength = isSingle ? 23 : 52;
  const bias = isSingle ? 127 : 1023;

  const sBit = signBit.slice(0, 1).padEnd(1, '0');
  const eBits = exponentBits.slice(0, expBitLength).padEnd(expBitLength, '0');
  const mBits = mantissaBits.slice(0, manBitLength).padEnd(manBitLength, '0');
  const fullBinary = sBit + eBits + mBits;

  const signDecimal = sBit === '1' ? -1 : 1;
  const exponentRaw = parseInt(eBits, 2);
  const allExpOnes = exponentRaw === (1 << expBitLength) - 1;
  const allExpZeros = exponentRaw === 0;
  const allManZeros = !mBits.includes('1');

  // Compute mantissa fraction: sum of bi * 2^(-i)
  let mantissaFraction = 0;
  for (let i = 0; i < mBits.length; i++) {
    if (mBits[i] === '1') {
      mantissaFraction += Math.pow(2, -(i + 1));
    }
  }

  let classification: FloatClassification;
  let implicitBit = 1;
  let exponentUnbiased = exponentRaw - bias;
  let decimalValue = 0;
  let formulaDisplay = '';
  const steps: string[] = [];

  // Steps breakdown
  steps.push(`Sign bit S = ${sBit} ➔ (-1)^${sBit} = ${signDecimal > 0 ? '+1' : '-1'}`);

  if (allExpOnes) {
    implicitBit = 0;
    if (allManZeros) {
      classification = sBit === '1' ? 'INFINITY_NEGATIVE' : 'INFINITY_POSITIVE';
      decimalValue = sBit === '1' ? -Infinity : Infinity;
      formulaDisplay = `${signDecimal > 0 ? '+' : '-'}Infinity (Exponent all 1s, Mantissa all 0s)`;
      steps.push(`Exponent = all 1s (${exponentRaw}), Mantissa = 0 ➔ Value represents ${classification}`);
    } else {
      classification = 'NAN';
      decimalValue = NaN;
      formulaDisplay = `NaN (Not a Number — Exponent all 1s, Non-zero Mantissa)`;
      steps.push(`Exponent = all 1s (${exponentRaw}), Mantissa is non-zero ➔ Value represents NaN`);
    }
  } else if (allExpZeros) {
    implicitBit = 0;
    if (allManZeros) {
      classification = sBit === '1' ? 'ZERO_NEGATIVE' : 'ZERO_POSITIVE';
      decimalValue = sBit === '1' ? -0 : 0;
      formulaDisplay = `${sBit === '1' ? '-0.0' : '+0.0'} (Signed Zero)`;
      steps.push(`Exponent = 0, Mantissa = 0 ➔ Value represents ${sBit === '1' ? '-0.0' : '+0.0'}`);
    } else {
      classification = 'SUBNORMAL';
      exponentUnbiased = 1 - bias;
      decimalValue = signDecimal * mantissaFraction * Math.pow(2, exponentUnbiased);
      formulaDisplay = `(-1)^${sBit} × (0 + ${mantissaFraction.toPrecision(6)}) × 2^(${1 - bias}) = ${decimalValue.toExponential(6)}`;
      steps.push(`Subnormal / Denormalized Number (Implicit bit is 0)`);
      steps.push(`Effective Exponent = 1 - ${bias} = ${exponentUnbiased}`);
      steps.push(`Mantissa Sum = 0.${mBits}₂ ≈ ${mantissaFraction.toFixed(8)}`);
      steps.push(`Calculated Decimal = ${decimalValue}`);
    }
  } else {
    classification = 'NORMAL';
    implicitBit = 1;
    exponentUnbiased = exponentRaw - bias;
    const significand = 1 + mantissaFraction;
    decimalValue = signDecimal * significand * Math.pow(2, exponentUnbiased);
    formulaDisplay = `(-1)^${sBit} × (1 + ${mantissaFraction.toFixed(6)}) × 2^(${exponentRaw} - ${bias}) = ${decimalValue}`;

    steps.push(`Normalized Number (Implicit leading bit is 1)`);
    steps.push(`Biased Exponent = ${exponentRaw}, Unbiased Exponent = ${exponentRaw} - ${bias} = ${exponentUnbiased}`);
    steps.push(`Significand = 1 + 0.${mBits.slice(0, 8)}...₂ = 1 + ${mantissaFraction.toFixed(7)} = ${significand.toFixed(7)}`);
    steps.push(`Formula: (${signDecimal > 0 ? '+1' : '-1'}) × ${significand.toFixed(7)} × 2^(${exponentUnbiased}) = ${decimalValue}`);
  }

  // Hex representation
  let hexString = '0x';
  for (let i = 0; i < fullBinary.length; i += 4) {
    hexString += parseInt(fullBinary.slice(i, i + 4), 2).toString(16).toUpperCase();
  }

  return {
    precision,
    totalBits,
    signBit: sBit,
    signDecimal,
    exponentBits: eBits,
    exponentRaw,
    exponentUnbiased,
    bias,
    mantissaBits: mBits,
    mantissaFraction,
    implicitBit,
    classification,
    decimalValue,
    formulaDisplay,
    stepsExplanation: steps,
    hexString,
    fullBinary,
  };
}
