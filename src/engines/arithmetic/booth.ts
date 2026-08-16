/**
 * Booth's 2's Complement Multiplication Algorithm Engine
 */

export interface BoothStep {
  stepIndex: number;
  cycle: number;
  operation: 'INITIAL' | 'ADD_M' | 'SUB_M' | 'NOOP' | 'ASR' | 'FINAL';
  opDescription: string;
  A: string;
  Q: string;
  qMinus1: string;
  M: string;
  negM: string;
  count: number;
  actionTaken: string;
  explanation: string;
  decimalProduct?: number;
}

export interface BoothResult {
  multiplicand: number;
  multiplier: number;
  bitWidth: number;
  steps: BoothStep[];
  finalProductBinary: string;
  finalProductDecimal: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Converts integer to two's complement binary string of length bits
 */
export function toTwosComplement(val: number, bits: number): string {
  const minVal = -(1 << (bits - 1));
  const maxVal = (1 << (bits - 1)) - 1;
  if (val < minVal || val > maxVal) {
    // clamp or wrap into bit width
    val = ((val % (1 << bits)) + (1 << bits)) % (1 << bits);
  }
  if (val < 0) {
    val = (1 << bits) + val;
  }
  return (val >>> 0).toString(2).padStart(bits, '0').slice(-bits);
}

/**
 * Interprets a binary string as a signed two's complement decimal integer
 */
export function fromTwosComplement(bin: string): number {
  const bits = bin.length;
  const unsignedVal = parseInt(bin, 2);
  if (bin[0] === '1') {
    return unsignedVal - (1 << bits);
  }
  return unsignedVal;
}

/**
 * Performs binary addition of two equal-length 2's complement strings
 */
export function addBinary(a: string, b: string): string {
  const bits = a.length;
  const numA = parseInt(a, 2);
  const numB = parseInt(b, 2);
  const sum = (numA + numB) & ((1 << bits) - 1);
  return sum.toString(2).padStart(bits, '0');
}

/**
 * Arithmetic Shift Right on registers A, Q, and qMinus1
 */
export function arithmeticShiftRight(a: string, q: string, qMinus1: string): { newA: string; newQ: string; newQMinus1: string } {
  const signBit = a[0];
  const combined = a + q + qMinus1; // length: bits + bits + 1
  
  const shiftedCombined = signBit + combined.slice(0, combined.length - 1);
  const bits = a.length;

  const newA = shiftedCombined.slice(0, bits);
  const newQ = shiftedCombined.slice(bits, bits * 2);
  const newQMinus1 = shiftedCombined[bits * 2];

  return { newA, newQ, newQMinus1 };
}

/**
 * Calculates optimal bit width needed for Booth's algorithm given M and Q
 */
export function getRequiredBitWidth(m: number, q: number): number {
  const maxAbs = Math.max(Math.abs(m), Math.abs(q));
  let bits = 4;
  while ((1 << (bits - 1)) - 1 < maxAbs || -(1 << (bits - 1)) > Math.min(m, q)) {
    bits++;
    if (bits >= 16) break;
  }
  return Math.max(bits, 4);
}

/**
 * Executes Booth's multiplication and generates all discrete micro-steps
 */
export function generateBoothSteps(
  multiplicand: number,
  multiplier: number,
  customBitWidth?: number
): BoothResult {
  const bitWidth = customBitWidth || getRequiredBitWidth(multiplicand, multiplier);
  const minVal = -(1 << (bitWidth - 1));
  const maxVal = (1 << (bitWidth - 1)) - 1;

  if (multiplicand < minVal || multiplicand > maxVal || multiplier < minVal || multiplier > maxVal) {
    return {
      multiplicand,
      multiplier,
      bitWidth,
      steps: [],
      finalProductBinary: '',
      finalProductDecimal: 0,
      isValid: false,
      errorMessage: `Values must be within [${minVal}, ${maxVal}] for ${bitWidth}-bit 2's complement.`,
    };
  }

  const M = toTwosComplement(multiplicand, bitWidth);
  const negM = toTwosComplement(-multiplicand, bitWidth);
  let A = '0'.repeat(bitWidth);
  let Q = toTwosComplement(multiplier, bitWidth);
  let qMinus1 = '0';
  let count = bitWidth;
  let stepIndex = 0;

  const steps: BoothStep[] = [];

  // Step 0: Initialization
  steps.push({
    stepIndex: stepIndex++,
    cycle: 0,
    operation: 'INITIAL',
    opDescription: 'Initialization',
    A,
    Q,
    qMinus1,
    M,
    negM,
    count,
    actionTaken: `Load Multiplicand M = ${multiplicand} (${M}), Multiplier Q = ${multiplier} (${Q}), A = 0, Q₋₁ = 0, Count = ${count}`,
    explanation: `Registers are initialized with ${bitWidth}-bit 2's complement representations. Multiplicand M = ${multiplicand} (${M}), -M = ${-multiplicand} (${negM}).`,
  });

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    const q0 = Q[Q.length - 1];
    const pair = `${q0}${qMinus1}`;

    if (pair === '10') {
      // A = A - M (A = A + negM)
      const prevA = A;
      A = addBinary(A, negM);
      steps.push({
        stepIndex: stepIndex++,
        cycle,
        operation: 'SUB_M',
        opDescription: `Cycle ${cycle}: A ← A - M (or A + 2's comp M)`,
        A,
        Q,
        qMinus1,
        M,
        negM,
        count,
        actionTaken: `Q₀Q₋₁ = 10 ➔ Subtract M from A (A = ${prevA} + ${negM} = ${A})`,
        explanation: `Since Q₀Q₋₁ = 10, the algorithm performs A ← A - M (adding two's complement ${negM}) to account for the transition.`,
      });
    } else if (pair === '01') {
      // A = A + M
      const prevA = A;
      A = addBinary(A, M);
      steps.push({
        stepIndex: stepIndex++,
        cycle,
        operation: 'ADD_M',
        opDescription: `Cycle ${cycle}: A ← A + M`,
        A,
        Q,
        qMinus1,
        M,
        negM,
        count,
        actionTaken: `Q₀Q₋₁ = 01 ➔ Add M to A (A = ${prevA} + ${M} = ${A})`,
        explanation: `Since Q₀Q₋₁ = 01, the algorithm performs A ← A + M (adding ${M}) to account for the transition.`,
      });
    } else {
      // 00 or 11: No arithmetic operation
      steps.push({
        stepIndex: stepIndex++,
        cycle,
        operation: 'NOOP',
        opDescription: `Cycle ${cycle}: No Operation (Q₀Q₋₁ = ${pair})`,
        A,
        Q,
        qMinus1,
        M,
        negM,
        count,
        actionTaken: `Q₀Q₋₁ = ${pair} ➔ No addition/subtraction needed`,
        explanation: `Since Q₀Q₋₁ = ${pair}, identical consecutive bits require no arithmetic operation before shifting.`,
      });
    }

    // Arithmetic Shift Right (ASR)
    const asrResult = arithmeticShiftRight(A, Q, qMinus1);
    A = asrResult.newA;
    Q = asrResult.newQ;
    qMinus1 = asrResult.newQMinus1;
    count--;

    steps.push({
      stepIndex: stepIndex++,
      cycle,
      operation: 'ASR',
      opDescription: `Cycle ${cycle}: Arithmetic Shift Right [A, Q, Q₋₁]`,
      A,
      Q,
      qMinus1,
      M,
      negM,
      count,
      actionTaken: `ASR [A, Q, Q₋₁] ➔ Count decremented to ${count}`,
      explanation: `Sign bit of A (${A[0]}) is retained, bits shift right across A into Q and Q₀ into Q₋₁. Sequence count becomes ${count}.`,
    });
  }

  const finalProductBinary = A + Q;
  const finalProductDecimal = fromTwosComplement(finalProductBinary);

  // Final step
  steps.push({
    stepIndex: stepIndex++,
    cycle: bitWidth,
    operation: 'FINAL',
    opDescription: 'Multiplication Complete',
    A,
    Q,
    qMinus1,
    M,
    negM,
    count: 0,
    actionTaken: `Final Product in [A, Q] = ${finalProductBinary}₂ = ${finalProductDecimal}₁₀`,
    explanation: `Multiplication is finished. Multiplicand (${multiplicand}) × Multiplier (${multiplier}) = ${multiplicand * multiplier}. Computed result: ${finalProductDecimal}.`,
    decimalProduct: finalProductDecimal,
  });

  return {
    multiplicand,
    multiplier,
    bitWidth,
    steps,
    finalProductBinary,
    finalProductDecimal,
    isValid: true,
  };
}
