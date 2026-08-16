import React, { useState, useMemo } from 'react';
import { 
  generateRestoringDivisionSteps, 
  generateNonRestoringDivisionSteps, 
  getDivisionBitWidth 
} from '../../engines/arithmetic/division.ts';
import { CheckCircle2, SplitSquareVertical } from 'lucide-react';

interface DivisionComparatorProps {
  dividend: number;
  divisor: number;
  bitWidth: number;
}

export const DivisionComparator: React.FC<DivisionComparatorProps> = ({
  dividend,
  divisor,
  bitWidth,
}) => {
  const [compareStep, setCompareStep] = useState<number>(0);

  const requiredBits = getDivisionBitWidth(dividend, divisor);
  const chosenBits = Math.max(bitWidth, requiredBits);

  const restoringRes = useMemo(() => {
    return generateRestoringDivisionSteps(dividend, divisor, chosenBits);
  }, [dividend, divisor, chosenBits]);

  const nonRestoringRes = useMemo(() => {
    return generateNonRestoringDivisionSteps(dividend, divisor, chosenBits);
  }, [dividend, divisor, chosenBits]);

  const maxSteps = Math.max(restoringRes.steps.length, nonRestoringRes.steps.length);
  const curRestoringStep = restoringRes.steps[Math.min(compareStep, restoringRes.steps.length - 1)];
  const curNonRestoringStep = nonRestoringRes.steps[Math.min(compareStep, nonRestoringRes.steps.length - 1)];

  return (
    <div className="flex flex-col gap-4 p-4 bg-card-bg border border-border-main rounded-2xl shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-main pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-text-heading">
              Side-by-Side Architectural Comparison: Restoring vs Non-Restoring Division
            </h3>
            <p className="text-xs text-text-muted">
              Comparing {dividend} ÷ {divisor} on {chosenBits}-bit hardware
            </p>
          </div>
        </div>

        {/* Step Scrubber for Comparator */}
        <div className="flex items-center gap-2 bg-card-surface p-1 rounded-xl border border-border-main">
          <button
            onClick={() => setCompareStep((prev) => Math.max(0, prev - 1))}
            disabled={compareStep === 0}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-text-body disabled:opacity-40 hover:bg-card-subtle transition-all"
          >
            Prev
          </button>
          <span className="text-xs font-mono font-bold text-accent-primary px-2">
            Step {compareStep + 1} / {maxSteps}
          </span>
          <button
            onClick={() => setCompareStep((prev) => Math.min(maxSteps - 1, prev + 1))}
            disabled={compareStep >= maxSteps - 1}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 disabled:opacity-40 transition-all"
          >
            Next
          </button>
        </div>
      </div>

      {/* Dual Side-by-Side Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Restoring Division */}
        <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
              <h4 className="text-xs font-black text-text-heading uppercase tracking-wider">
                Restoring Division
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
              Total Steps: {restoringRes.steps.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Accumulator (A)</span>
              <span className="text-base font-black text-accent-primary">{curRestoringStep?.A}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Quotient (Q)</span>
              <span className="text-base font-black text-accent-amber">{curRestoringStep?.Q}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-card-bg border border-border-main text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-text-muted">Operation:</span>
              <span className="text-accent-primary font-mono">{curRestoringStep?.operation}</span>
            </div>
            <p className="text-text-body text-[11px] leading-relaxed">
              {curRestoringStep?.actionTaken}
            </p>
          </div>

          <div className="mt-auto pt-2 border-t border-border-main/50 text-[11px] text-text-muted">
            <strong>Characteristics:</strong> If trial subtraction $(A - M) &lt; 0$, an extra restore addition $(A \leftarrow A + M)$ is required before setting $Q_0 = 0$.
          </div>
        </div>

        {/* Right: Non-Restoring Division */}
        <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald" />
              <h4 className="text-xs font-black text-text-heading uppercase tracking-wider">
                Non-Restoring Division
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-emerald/10 text-accent-emerald">
              Total Steps: {nonRestoringRes.steps.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Accumulator (A)</span>
              <span className="text-base font-black text-accent-emerald">{curNonRestoringStep?.A}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Quotient (Q)</span>
              <span className="text-base font-black text-accent-amber">{curNonRestoringStep?.Q}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-card-bg border border-border-main text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-text-muted">Operation:</span>
              <span className="text-accent-emerald font-mono">{curNonRestoringStep?.operation}</span>
            </div>
            <p className="text-text-body text-[11px] leading-relaxed">
              {curNonRestoringStep?.actionTaken}
            </p>
          </div>

          <div className="mt-auto pt-2 border-t border-border-main/50 text-[11px] text-text-muted">
            <strong>Characteristics:</strong> Never restores immediately. If $A &lt; 0$, next cycle shifts and adds $+M$ ($2A + M$); if $A \ge 0$, shifts and subtracts $-M$ ($2A - M$). Saves cycles!
          </div>
        </div>
      </div>

      {/* Final Performance Summary */}
      <div className="p-3.5 rounded-xl bg-accent-primary/5 border border-accent-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
          <span className="text-text-heading font-bold">
            Mathematical Result: Quotient = {restoringRes.quotientDecimal}, Remainder = {restoringRes.remainderDecimal}
          </span>
        </div>
        <div className="font-mono text-text-muted">
          Efficiency Gain: Non-Restoring avoids redundant restoration additions
        </div>
      </div>
    </div>
  );
};
