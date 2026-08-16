/**
 * Number Systems & Complement Sandbox Engine
 */

export interface NumberSystemState {
  decimal: number;
  binary: string;
  octal: string;
  hexadecimal: string;
  bitWidth: number;
  signedMagnitude: string;
  onesComplement: string;
  twosComplement: string;
  unsignedValue: number;
  signedValue: number;
  isNegative: boolean;
  isOverflow: boolean;
  minSigned: number;
  maxSigned: number;
  maxUnsigned: number;
}

export interface ComplementSteps {
  inputDecimal: number;
  bitWidth: number;
  originalBinary: string;
  invertedBits: string; // 1's comp
  twosComplementBits: string; // 2's comp
  steps: string[];
}

/**
 * Calculates complement representations and radix conversions for a number
 */
export function convertNumberSystems(value: number, bitWidth: number = 8): NumberSystemState {
  const minSigned = -(1 << (bitWidth - 1));
  const maxSigned = (1 << (bitWidth - 1)) - 1;
  const maxUnsigned = (1 << bitWidth) - 1;

  const isOverflow = value < minSigned || value > maxUnsigned;
  const isNegative = value < 0;

  // Unsigned wrapping
  const unsignedVal = ((value % (1 << bitWidth)) + (1 << bitWidth)) % (1 << bitWidth);
  const binary = unsignedVal.toString(2).padStart(bitWidth, '0');
  const octal = unsignedVal.toString(8).toUpperCase();
  const hexadecimal = unsignedVal.toString(16).toUpperCase();

  // Signed Magnitude
  const absVal = Math.min(Math.abs(value), (1 << (bitWidth - 1)) - 1);
  const magBits = absVal.toString(2).padStart(bitWidth - 1, '0');
  const signedMagnitude = (isNegative ? '1' : '0') + magBits;

  // 1's Complement
  let onesComplement = '';
  if (isNegative) {
    const posBits = Math.abs(value).toString(2).padStart(bitWidth, '0');
    onesComplement = posBits.split('').map(b => (b === '0' ? '1' : '0')).join('');
  } else {
    onesComplement = value.toString(2).padStart(bitWidth, '0');
  }

  // 2's Complement
  let twosComplement = '';
  if (isNegative) {
    const posVal = Math.abs(value);
    const posBits = posVal.toString(2).padStart(bitWidth, '0');
    const inverted = posBits.split('').map(b => (b === '0' ? '1' : '0')).join('');
    const plusOne = (parseInt(inverted, 2) + 1) & ((1 << bitWidth) - 1);
    twosComplement = plusOne.toString(2).padStart(bitWidth, '0');
  } else {
    twosComplement = (value & ((1 << bitWidth) - 1)).toString(2).padStart(bitWidth, '0');
  }

  // Signed value from 2's complement
  let signedValue = unsignedVal;
  if (binary[0] === '1' && unsignedVal >= (1 << (bitWidth - 1))) {
    signedValue = unsignedVal - (1 << bitWidth);
  }

  return {
    decimal: value,
    binary,
    octal,
    hexadecimal,
    bitWidth,
    signedMagnitude,
    onesComplement,
    twosComplement,
    unsignedValue: unsignedVal,
    signedValue,
    isNegative,
    isOverflow,
    minSigned,
    maxSigned,
    maxUnsigned,
  };
}

/**
 * Step-by-step generator for 1's and 2's complement of a negative number
 */
export function generateComplementSteps(decimalValue: number, bitWidth: number = 8): ComplementSteps {
  const absVal = Math.abs(decimalValue);
  const originalBinary = absVal.toString(2).padStart(bitWidth, '0');
  const invertedBits = originalBinary.split('').map(b => (b === '0' ? '1' : '0')).join('');
  const twosCompVal = (parseInt(invertedBits, 2) + 1) & ((1 << bitWidth) - 1);
  const twosComplementBits = twosCompVal.toString(2).padStart(bitWidth, '0');

  const steps: string[] = [
    `1. Write true positive binary representation of |${decimalValue}| = ${absVal} in ${bitWidth} bits: ${originalBinary}₂`,
    `2. Take 1's Complement (invert all bits: 0 ➔ 1, 1 ➔ 0): ${invertedBits}₂`,
    `3. Add 1 to the 1's complement result (${invertedBits}₂ + 1): ${twosComplementBits}₂`,
    `4. Result: 2's complement representation of ${decimalValue} is ${twosComplementBits}₂ (Hex: 0x${twosCompVal.toString(16).toUpperCase()})`,
  ];

  return {
    inputDecimal: decimalValue,
    bitWidth,
    originalBinary,
    invertedBits,
    twosComplementBits,
    steps,
  };
}

/**
 * Generalized Radix (r's) and Diminished Radix ((r-1)'s) Complements
 */
export function computeRadixComplements(numberStr: string, radix: number, totalDigits: number) {
  const cleanStr = numberStr.trim().toUpperCase();
  const paddedStr = cleanStr.padStart(totalDigits, '0');
  
  // (r-1)'s complement
  const maxDigit = radix - 1;
  let diminishedComplement = '';
  for (let i = 0; i < paddedStr.length; i++) {
    const digitVal = parseInt(paddedStr[i], radix);
    const diff = maxDigit - digitVal;
    diminishedComplement += diff.toString(radix).toUpperCase();
  }

  // r's complement = (r-1)'s complement + 1
  const diminishedDec = parseInt(diminishedComplement, radix);
  const radixCompDec = (diminishedDec + 1) % Math.pow(radix, totalDigits);
  const radixComplement = radixCompDec.toString(radix).padStart(totalDigits, '0').toUpperCase();

  return {
    radix,
    totalDigits,
    original: paddedStr,
    diminishedRadixName: `${radix - 1}'s Complement`,
    diminishedComplement,
    radixName: `${radix}'s Complement`,
    radixComplement,
    formula: `r's Complement = (r^n - N) mod r^n = ${radix}^${totalDigits} - ${cleanStr}`,
  };
}
