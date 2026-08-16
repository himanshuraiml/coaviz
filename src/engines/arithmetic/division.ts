/**
 * Restoring & Non-Restoring Binary Division Engines
 */

export interface DivisionStep {
  stepIndex: number;
  cycle: number;
  operation: 'INITIAL' | 'SHIFT_LEFT' | 'SUBTRACT_M' | 'ADD_M' | 'RESTORE' | 'SET_Q0' | 'FINAL_CORRECTION' | 'FINAL';
  opDescription: string;
  A: string;
  Q: string;
  M: string;
  count: number;
  actionTaken: string;
  explanation: string;
  isRestored?: boolean;
  q0Value?: '0' | '1';
}

export interface DivisionResult {
  algorithm: 'restoring' | 'non-restoring';
  dividend: number;
  divisor: number;
  bitWidth: number;
  steps: DivisionStep[];
  quotientBinary: string;
  remainderBinary: string;
  quotientDecimal: number;
  remainderDecimal: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Converts unsigned integer to binary string of given bit width
 */
export function toUnsignedBinary(val: number, bits: number): string {
  return (val >>> 0).toString(2).padStart(bits, '0').slice(-bits);
}

/**
 * Helper to compute required bit width for unsigned division
 */
export function getDivisionBitWidth(dividend: number, divisor: number): number {
  const maxVal = Math.max(dividend, divisor);
  let bits = 4;
  while ((1 << bits) - 1 < maxVal) {
    bits++;
    if (bits >= 16) break;
  }
  return Math.max(bits, 4);
}

/**
 * Shift Left across registers A and Q
 */
function shiftLeftAQ(a: string, q: string): { newA: string; newQ: string; shiftedBit: string } {
  const combined = a + q;
  const shifted = combined.slice(1) + '0';
  const aBits = a.length;
  const qBits = q.length;

  const newA = shifted.slice(0, aBits);
  const newQ = shifted.slice(aBits, aBits + qBits);
  const shiftedBit = q[0];

  return { newA, newQ, shiftedBit };
}

/**
 * Restoring Division Step Generator
 */
export function generateRestoringDivisionSteps(
  dividend: number,
  divisor: number,
  customBitWidth?: number
): DivisionResult {
  if (divisor === 0) {
    return {
      algorithm: 'restoring',
      dividend,
      divisor,
      bitWidth: 4,
      steps: [],
      quotientBinary: '0',
      remainderBinary: '0',
      quotientDecimal: 0,
      remainderDecimal: 0,
      isValid: false,
      errorMessage: 'Division by zero is undefined.',
    };
  }

  const bitWidth = customBitWidth || getDivisionBitWidth(dividend, divisor);
  const aWidth = bitWidth + 1; // 1 extra bit for sign tracking

  const M = toUnsignedBinary(divisor, aWidth);
  let A = '0'.repeat(aWidth);
  let Q = toUnsignedBinary(dividend, bitWidth);
  let count = bitWidth;
  let stepIndex = 0;

  const steps: DivisionStep[] = [];

  // Step 0: Initialization
  steps.push({
    stepIndex: stepIndex++,
    cycle: 0,
    operation: 'INITIAL',
    opDescription: 'Initialization',
    A,
    Q,
    M,
    count,
    actionTaken: `Load Dividend Q = ${dividend} (${Q}), Divisor M = ${divisor} (${M}), A = ${A}, Count = ${count}`,
    explanation: `Accumulator A is initialized to 0 (${aWidth} bits), Q holds Dividend (${bitWidth} bits), M holds Divisor (${aWidth} bits).`,
  });

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    // 1. Shift Left [A, Q]
    const shift = shiftLeftAQ(A, Q);
    A = shift.newA;
    Q = shift.newQ;

    steps.push({
      stepIndex: stepIndex++,
      cycle,
      operation: 'SHIFT_LEFT',
      opDescription: `Cycle ${cycle}: Shift Left [A, Q]`,
      A,
      Q,
      M,
      count,
      actionTaken: `Shift left [A, Q] by 1 bit (Most significant bit of Q shifted into A)`,
      explanation: `Combined register [A, Q] is shifted left. A becomes ${A}, Q becomes ${Q}.`,
    });

    // 2. Subtract M from A (A = A - M)
    const numA = parseInt(A, 2);
    const numM = parseInt(M, 2);
    let diff = numA - numM;
    const isNegative = diff < 0;
    if (isNegative) {
      diff = (1 << aWidth) + diff;
    }
    A = (diff >>> 0).toString(2).padStart(aWidth, '0').slice(-aWidth);

    steps.push({
      stepIndex: stepIndex++,
      cycle,
      operation: 'SUBTRACT_M',
      opDescription: `Cycle ${cycle}: A ← A - M`,
      A,
      Q,
      M,
      count,
      actionTaken: `Compute A - M (${numA} - ${numM} = ${numA - numM}) ➔ A = ${A}`,
      explanation: `Subtracted divisor from accumulator. Sign bit of A is ${A[0]} (${isNegative ? 'Negative' : 'Positive'}).`,
    });

    // 3. Check Sign & Restore if Negative
    if (isNegative) {
      // Restore A
      const restored = (parseInt(A, 2) + numM) & ((1 << aWidth) - 1);
      A = restored.toString(2).padStart(aWidth, '0').slice(-aWidth);
      // Set Q0 = 0
      Q = Q.slice(0, -1) + '0';
      count--;

      steps.push({
        stepIndex: stepIndex++,
        cycle,
        operation: 'RESTORE',
        opDescription: `Cycle ${cycle}: A < 0 ➔ Restore A ← A + M, Set Q₀ = 0`,
        A,
        Q,
        M,
        count,
        actionTaken: `A is negative ➔ Restored A = ${A}, Set Q₀ = 0, Count = ${count}`,
        explanation: `Since A was negative, subtraction did not fit. We restore A by adding M back and record quotient bit Q₀ = 0.`,
        isRestored: true,
        q0Value: '0',
      });
    } else {
      // Keep A, Set Q0 = 1
      Q = Q.slice(0, -1) + '1';
      count--;

      steps.push({
        stepIndex: stepIndex++,
        cycle,
        operation: 'SET_Q0',
        opDescription: `Cycle ${cycle}: A ≥ 0 ➔ Set Q₀ = 1 (No Restore needed)`,
        A,
        Q,
        M,
        count,
        actionTaken: `A is positive ➔ Retain A = ${A}, Set Q₀ = 1, Count = ${count}`,
        explanation: `Since A is non-negative, divisor fits. Accumulator is kept as-is and quotient bit Q₀ is set to 1.`,
        isRestored: false,
        q0Value: '1',
      });
    }
  }

  const quotientDecimal = parseInt(Q, 2);
  const remainderDecimal = parseInt(A, 2);

  // Final Step
  steps.push({
    stepIndex: stepIndex++,
    cycle: bitWidth,
    operation: 'FINAL',
    opDescription: 'Restoring Division Complete',
    A,
    Q,
    M,
    count: 0,
    actionTaken: `Quotient Q = ${Q}₂ (${quotientDecimal}), Remainder A = ${A}₂ (${remainderDecimal})`,
    explanation: `Division completed in ${bitWidth} cycles. Formula check: ${dividend} = (${divisor} × ${quotientDecimal}) + ${remainderDecimal}.`,
  });

  return {
    algorithm: 'restoring',
    dividend,
    divisor,
    bitWidth,
    steps,
    quotientBinary: Q,
    remainderBinary: A,
    quotientDecimal,
    remainderDecimal,
    isValid: true,
  };
}

/**
 * Non-Restoring Division Step Generator
 */
export function generateNonRestoringDivisionSteps(
  dividend: number,
  divisor: number,
  customBitWidth?: number
): DivisionResult {
  if (divisor === 0) {
    return {
      algorithm: 'non-restoring',
      dividend,
      divisor,
      bitWidth: 4,
      steps: [],
      quotientBinary: '0',
      remainderBinary: '0',
      quotientDecimal: 0,
      remainderDecimal: 0,
      isValid: false,
      errorMessage: 'Division by zero is undefined.',
    };
  }

  const bitWidth = customBitWidth || getDivisionBitWidth(dividend, divisor);
  const aWidth = bitWidth + 1;

  const M = toUnsignedBinary(divisor, aWidth);
  let A = '0'.repeat(aWidth);
  let Q = toUnsignedBinary(dividend, bitWidth);
  let count = bitWidth;
  let stepIndex = 0;

  const steps: DivisionStep[] = [];

  // Step 0: Initialization
  steps.push({
    stepIndex: stepIndex++,
    cycle: 0,
    operation: 'INITIAL',
    opDescription: 'Initialization',
    A,
    Q,
    M,
    count,
    actionTaken: `Load Dividend Q = ${dividend} (${Q}), Divisor M = ${divisor} (${M}), A = ${A}, Count = ${count}`,
    explanation: `Non-Restoring Division avoids restoring step on negative intermediate remainders. A = 0 (${aWidth}b), Q = ${Q} (${bitWidth}b).`,
  });

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    const isAPrevNegative = A[0] === '1';

    // 1. Shift Left [A, Q]
    const shift = shiftLeftAQ(A, Q);
    A = shift.newA;
    Q = shift.newQ;

    steps.push({
      stepIndex: stepIndex++,
      cycle,
      operation: 'SHIFT_LEFT',
      opDescription: `Cycle ${cycle}: Shift Left [A, Q]`,
      A,
      Q,
      M,
      count,
      actionTaken: `Shift left [A, Q] (Previous A was ${isAPrevNegative ? 'Negative (< 0)' : 'Positive (≥ 0)'})`,
      explanation: `Combined register [A, Q] shifted left. Next operation will be ${isAPrevNegative ? 'ADD M (A ← A + M)' : 'SUBTRACT M (A ← A - M)'}.`,
    });

    const numA = parseInt(A, 2);
    const numM = parseInt(M, 2);

    if (!isAPrevNegative) {
      // Previous A >= 0: A = A - M
      let diff = numA - numM;
      if (diff < 0) diff = (1 << aWidth) + diff;
      A = (diff >>> 0).toString(2).padStart(aWidth, '0').slice(-aWidth);

      const isNowNegative = A[0] === '1';
      const qBit = isNowNegative ? '0' : '1';
      Q = Q.slice(0, -1) + qBit;
      count--;

      steps.push({
        stepIndex: stepIndex++,
        cycle,
        operation: 'SUBTRACT_M',
        opDescription: `Cycle ${cycle}: A ← A - M & Set Q₀ = ${qBit}`,
        A,
        Q,
        M,
        count,
        actionTaken: `A - M ➔ A = ${A}, Sign bit = ${A[0]} ➔ Set Q₀ = ${qBit}, Count = ${count}`,
        explanation: `Since previous A was ≥ 0, we subtracted M. Resulting sign bit is ${A[0]}, so Q₀ is set to ${qBit}.`,
        q0Value: qBit as '0' | '1',
      });
    } else {
      // Previous A < 0: A = A + M
      const sum = (numA + numM) & ((1 << aWidth) - 1);
      A = sum.toString(2).padStart(aWidth, '0').slice(-aWidth);

      const isNowNegative = A[0] === '1';
      const qBit = isNowNegative ? '0' : '1';
      Q = Q.slice(0, -1) + qBit;
      count--;

      steps.push({
        stepIndex: stepIndex++,
        cycle,
        operation: 'ADD_M',
        opDescription: `Cycle ${cycle}: A ← A + M & Set Q₀ = ${qBit}`,
        A,
        Q,
        M,
        count,
        actionTaken: `A + M ➔ A = ${A}, Sign bit = ${A[0]} ➔ Set Q₀ = ${qBit}, Count = ${count}`,
        explanation: `Since previous A was < 0, we added M. Resulting sign bit is ${A[0]}, so Q₀ is set to ${qBit}.`,
        q0Value: qBit as '0' | '1',
      });
    }
  }

  // Final Correction: If A is negative at end of all cycles, A = A + M
  if (A[0] === '1') {
    const numA = parseInt(A, 2);
    const numM = parseInt(M, 2);
    const correctedA = (numA + numM) & ((1 << aWidth) - 1);
    A = correctedA.toString(2).padStart(aWidth, '0').slice(-aWidth);

    steps.push({
      stepIndex: stepIndex++,
      cycle: bitWidth,
      operation: 'FINAL_CORRECTION',
      opDescription: 'Final Correction: A < 0 ➔ A ← A + M',
      A,
      Q,
      M,
      count: 0,
      actionTaken: `Final remainder A was negative ➔ Added M to correct remainder: A = ${A}`,
      explanation: `In Non-Restoring division, if the final accumulator is negative, one final addition (A ← A + M) is required to obtain the true positive remainder.`,
      isRestored: true,
    });
  }

  const quotientDecimal = parseInt(Q, 2);
  const remainderDecimal = parseInt(A, 2);

  steps.push({
    stepIndex: stepIndex++,
    cycle: bitWidth,
    operation: 'FINAL',
    opDescription: 'Non-Restoring Division Complete',
    A,
    Q,
    M,
    count: 0,
    actionTaken: `Quotient Q = ${Q}₂ (${quotientDecimal}), Remainder A = ${A}₂ (${remainderDecimal})`,
    explanation: `Non-Restoring Division finished. Verification: ${dividend} = (${divisor} × ${quotientDecimal}) + ${remainderDecimal}.`,
  });

  return {
    algorithm: 'non-restoring',
    dividend,
    divisor,
    bitWidth,
    steps,
    quotientBinary: Q,
    remainderBinary: A,
    quotientDecimal,
    remainderDecimal,
    isValid: true,
  };
}
