import { describe, it, expect } from 'vitest';
import { generateRestoringDivisionSteps, generateNonRestoringDivisionSteps } from './division.ts';

describe('Division Engines (Restoring & Non-Restoring)', () => {
  describe('Restoring Division', () => {
    it('divides 11 / 3 = Quotient 3, Remainder 2', () => {
      const res = generateRestoringDivisionSteps(11, 3, 4);
      expect(res.isValid).toBe(true);
      expect(res.quotientDecimal).toBe(3);
      expect(res.remainderDecimal).toBe(2);
    });

    it('divides 7 / 2 = Quotient 3, Remainder 1', () => {
      const res = generateRestoringDivisionSteps(7, 2, 4);
      expect(res.isValid).toBe(true);
      expect(res.quotientDecimal).toBe(3);
      expect(res.remainderDecimal).toBe(1);
    });

    it('divides 15 / 5 = Quotient 3, Remainder 0', () => {
      const res = generateRestoringDivisionSteps(15, 5, 4);
      expect(res.isValid).toBe(true);
      expect(res.quotientDecimal).toBe(3);
      expect(res.remainderDecimal).toBe(0);
    });

    it('handles division by zero gracefully', () => {
      const res = generateRestoringDivisionSteps(10, 0);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBeDefined();
    });
  });

  describe('Non-Restoring Division', () => {
    it('divides 11 / 3 = Quotient 3, Remainder 2', () => {
      const res = generateNonRestoringDivisionSteps(11, 3, 4);
      expect(res.isValid).toBe(true);
      expect(res.quotientDecimal).toBe(3);
      expect(res.remainderDecimal).toBe(2);
    });

    it('divides 7 / 2 = Quotient 3, Remainder 1', () => {
      const res = generateNonRestoringDivisionSteps(7, 2, 4);
      expect(res.isValid).toBe(true);
      expect(res.quotientDecimal).toBe(3);
      expect(res.remainderDecimal).toBe(1);
    });

    it('divides 14 / 3 = Quotient 4, Remainder 2', () => {
      const res = generateNonRestoringDivisionSteps(14, 3, 4);
      expect(res.isValid).toBe(true);
      expect(res.quotientDecimal).toBe(4);
      expect(res.remainderDecimal).toBe(2);
    });

    it('handles division by zero gracefully', () => {
      const res = generateNonRestoringDivisionSteps(10, 0);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBeDefined();
    });
  });
});
