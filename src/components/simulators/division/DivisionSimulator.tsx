import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  generateRestoringDivisionSteps, 
  generateNonRestoringDivisionSteps, 
  DivisionResult, 
  getDivisionBitWidth 
} from '../../../engines/arithmetic/division.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { DivisionComparator } from '../../comparative/DivisionComparator.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { Binary, Sparkles, SplitSquareVertical, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const DivisionSimulator: React.FC = () => {
  const [algorithm, setAlgorithm] = usePersistentState<'restoring' | 'non-restoring'>('div_algo', 'restoring');
  const [dividend, setDividend] = usePersistentState<number>('div_q', 11);
  const [divisor, setDivisor] = usePersistentState<number>('div_m', 3);
  const [bitWidth, setBitWidth] = usePersistentState<number>('div_bits', 4);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Phase 3 Comparative & Practice Mode State
  const [isComparativeView, setIsComparativeView] = useState<boolean>(false);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [practiceResult, setPracticeResult] = useState<'correct' | 'wrong' | null>(null);

  // Compute division steps
  const divisionResult: DivisionResult = useMemo(() => {
    const requiredBits = getDivisionBitWidth(dividend, divisor);
    const chosenBits = Math.max(bitWidth, requiredBits);
    if (algorithm === 'restoring') {
      return generateRestoringDivisionSteps(dividend, divisor, chosenBits);
    } else {
      return generateNonRestoringDivisionSteps(dividend, divisor, chosenBits);
    }
  }, [algorithm, dividend, divisor, bitWidth]);

  const steps = divisionResult.steps;
  const totalSteps = steps.length;
  const activeStep = steps[currentStep] || steps[0];
  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    return {
      title: `${algorithm === 'restoring' ? 'Restoring' : 'Non-Restoring'} Binary Division Simulation Trace`,
      subtitle: `Division of Dividend (${dividend}) ÷ Divisor (${divisor})`,
      parameters: {
        'Algorithm': algorithm,
        'Dividend (Q)': dividend,
        'Divisor (M)': divisor,
        'Bit Width (n)': bitWidth,
        'Quotient (Q)': divisionResult.quotientDecimal,
        'Remainder (A)': divisionResult.remainderDecimal,
      },
      columns: [
        { key: 'stepIndex', header: 'Step' },
        { key: 'cycle', header: 'Cycle' },
        { key: 'operation', header: 'Operation' },
        { key: 'A', header: 'Accumulator / Remainder (A)' },
        { key: 'Q', header: 'Quotient (Q)' },
        { key: 'count', header: 'Count' },
        { key: 'actionTaken', header: 'Action' },
      ],
      rows: steps.map((s) => ({
        stepIndex: s.stepIndex,
        cycle: s.cycle,
        operation: s.operation,
        A: s.A,
        Q: s.Q,
        count: s.count,
        actionTaken: s.actionTaken,
      })),
      conclusion: `Final Result: Quotient = ${divisionResult.quotientDecimal} (${divisionResult.quotientBinary}), Remainder = ${divisionResult.remainderDecimal} (${divisionResult.remainderBinary})`,
    };
  }, [algorithm, dividend, divisor, bitWidth, divisionResult, steps]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return steps.map((s, idx) => ({
      stepIndex: idx,
      label: s.operation === 'INITIAL' ? 'Init' : s.operation,
      category: s.operation === 'INITIAL' ? 'init' : s.operation === 'FINAL' ? 'result' : 'compute',
    }));
  }, [steps]);

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      const intervalMs = Math.max(300, 1500 / speed);
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, totalSteps]);

  // Confetti on completion
  useEffect(() => {
    if (currentStep === totalSteps - 1 && totalSteps > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  }, [currentStep, totalSteps]);

  const handleStepForward = useCallback(() => {
    setPracticeAnswer(null);
    setPracticeResult(null);
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const handleStepBackward = useCallback(() => {
    setPracticeAnswer(null);
    setPracticeResult(null);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setPracticeAnswer(null);
    setPracticeResult(null);
    setCurrentStep(0);
  }, []);

  const handleSeek = useCallback((stepIdx: number) => {
    setIsPlaying(false);
    setPracticeAnswer(null);
    setPracticeResult(null);
    setCurrentStep(Math.max(0, Math.min(totalSteps - 1, stepIdx)));
  }, [totalSteps]);

  const handlePracticeChoice = (choice: 'RESTORE' | 'KEEP_Q1' | 'SET_Q0') => {
    setPracticeAnswer(choice);
    const nextStep = steps[currentStep + 1];
    if (!nextStep) return;

    if (
      (choice === 'RESTORE' && nextStep.operation === 'RESTORE') ||
      (choice === 'SET_Q0' && nextStep.operation === 'SET_Q0' && nextStep.actionTaken.includes('Q0=0')) ||
      (choice === 'KEEP_Q1' && nextStep.actionTaken.includes('Q0=1'))
    ) {
      setPracticeResult('correct');
    } else {
      setPracticeResult('wrong');
    }
  };

  const presets = [
    { label: '11 ÷ 3', d: 11, m: 3, bits: 4 },
    { label: '7 ÷ 2', d: 7, m: 2, bits: 4 },
    { label: '14 ÷ 3', d: 14, m: 3, bits: 4 },
    { label: '15 ÷ 4', d: 15, m: 4, bits: 4 },
    { label: '9 ÷ 3', d: 9, m: 3, bits: 4 },
  ];

  // State diff checks
  const isAChanged = prevStep && prevStep.A !== activeStep.A;
  const isQChanged = prevStep && prevStep.Q !== activeStep.Q;

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* Algorithm Mode Switcher & Presets */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Toggle Algorithm */}
        <div className="flex items-center gap-1.5 bg-card-surface p-1 rounded-xl border border-border-main">
          <button
            onClick={() => {
              setAlgorithm('restoring');
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              algorithm === 'restoring'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-heading hover:bg-card-subtle'
            }`}
          >
            Restoring Division
          </button>
          <button
            onClick={() => {
              setAlgorithm('non-restoring');
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              algorithm === 'non-restoring'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-heading hover:bg-card-subtle'
            }`}
          >
            Non-Restoring Division
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDividend(p.d);
                setDivisor(p.m);
                setBitWidth(p.bits);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                dividend === p.d && divisor === p.m
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'bg-card-surface border border-border-main text-text-body hover:border-accent-primary hover:bg-card-subtle'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Action Controls: Comparative View, Practice Mode & Export */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Comparative Mode Button */}
          <button
            onClick={() => setIsComparativeView(!isComparativeView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isComparativeView
                ? 'bg-accent-secondary text-white border-accent-secondary shadow-sm'
                : 'bg-card-surface border-border-main text-text-body hover:border-accent-secondary'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Comparative View</span>
          </button>

          {/* Practice Mode Button */}
          <button
            onClick={() => setIsPracticeMode(!isPracticeMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isPracticeMode
                ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm'
                : 'bg-card-surface border-border-main text-text-body hover:border-indigo-500'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Practice</span>
          </button>

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix={`division-${algorithm}`} />
        </div>
      </div>

      {/* Side-by-Side Comparative View Component */}
      {isComparativeView && (
        <DivisionComparator
          dividend={dividend}
          divisor={divisor}
          bitWidth={bitWidth}
        />
      )}

      {/* Input Parameters Bar */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Dividend (Q):</label>
            <input
              type="number"
              min="0"
              value={dividend}
              onChange={(e) => {
                setDividend(Math.max(0, parseInt(e.target.value) || 0));
                setCurrentStep(0);
              }}
              className="w-16 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-sm font-bold text-accent-amber text-center focus:outline-none focus:border-accent-amber"
            />
          </div>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Divisor (M):</label>
            <input
              type="number"
              min="1"
              value={divisor}
              onChange={(e) => {
                setDivisor(Math.max(1, parseInt(e.target.value) || 1));
                setCurrentStep(0);
              }}
              className="w-16 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-sm font-bold text-accent-primary text-center focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Bits (n):</label>
            <select
              value={bitWidth}
              onChange={(e) => {
                setBitWidth(parseInt(e.target.value));
                setCurrentStep(0);
              }}
              className="bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-sm font-bold text-text-heading focus:outline-none focus:border-accent-primary"
            >
              {[3, 4, 5, 6].map((b) => (
                <option key={b} value={b}>{b} bits</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-text-muted">
          Expected: Q = <span className="text-accent-emerald font-extrabold">{divisionResult.quotientDecimal}</span>, R = <span className="text-accent-primary font-extrabold">{divisionResult.remainderDecimal}</span>
        </div>
      </div>

      {/* Practice / Predict Mode Interactive Banner */}
      {isPracticeMode && currentStep < totalSteps - 1 && (
        <div className="bg-indigo-500/10 border-2 border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs uppercase font-black tracking-wider text-indigo-500">
                Division Challenge
              </span>
              <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                Sign A[MSB] = {activeStep?.A ? activeStep.A[0] : '0'}
              </span>
            </div>
            <p className="text-sm font-bold text-text-heading">
              Based on the Accumulator Sign bit, what is the next step?
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {[
              { label: 'Restore A (A ← A + M)', id: 'RESTORE' as const },
              { label: 'Set Q₀ = 1 (Successful Subtraction)', id: 'KEEP_Q1' as const },
              { label: 'Set Q₀ = 0 (Unsuccessful Subtraction)', id: 'SET_Q0' as const },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handlePracticeChoice(opt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  practiceAnswer === opt.id
                    ? practiceResult === 'correct'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-rose-500 text-white border-rose-600'
                    : 'bg-card-bg border-border-main text-text-body hover:border-indigo-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {practiceResult && (
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {practiceResult === 'correct' ? (
                <div className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correct! Click Next to verify.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-500">
                  <XCircle className="w-4 h-4" />
                  <span>Incorrect. Check sign bit!</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Registers Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Register A (Accumulator / Remainder) */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          isAChanged
            ? 'border-accent-primary ring-2 ring-accent-primary/40 bg-accent-primary/5'
            : 'border-border-main'
        }`}>
          <div className="text-xs font-bold text-accent-primary mb-1 flex items-center justify-between">
            <span>Accumulator (A)</span>
            <span className="text-[10px] bg-accent-primary/10 px-1.5 py-0.5 rounded font-mono font-bold">{activeStep?.A?.length || bitWidth + 1}b</span>
          </div>
          <div className="font-mono text-2xl font-black text-text-heading tracking-widest my-1 truncate">
            {activeStep?.A || '0'.repeat(bitWidth + 1)}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Sign bit: <span className="font-bold text-text-heading">{activeStep?.A ? activeStep.A[0] : '0'}</span> ({activeStep?.A && activeStep.A[0] === '1' ? 'Negative' : 'Non-Negative'})
          </div>
        </div>

        {/* Register Q (Quotient / Dividend) */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          isQChanged
            ? 'border-accent-amber ring-2 ring-accent-amber/40 bg-accent-amber/5'
            : 'border-border-main'
        }`}>
          <div className="text-xs font-bold text-accent-amber mb-1 flex items-center justify-between">
            <span>Dividend / Quotient (Q)</span>
            <span className="text-[10px] bg-accent-amber/10 px-1.5 py-0.5 rounded font-mono font-bold">{activeStep?.Q?.length || bitWidth}b</span>
          </div>
          <div className="font-mono text-2xl font-black text-text-heading tracking-widest my-1 truncate">
            {activeStep?.Q || '0'.repeat(bitWidth)}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Dec: {activeStep ? parseInt(activeStep.Q, 2) : 0}
          </div>
        </div>

        {/* Register M (Divisor) */}
        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-secondary mb-1 flex items-center justify-between">
            <span>Divisor (M)</span>
            <span className="text-[10px] bg-accent-secondary/10 px-1.5 py-0.5 rounded font-mono font-bold">{bitWidth + 1}b</span>
          </div>
          <div className="font-mono text-xl font-bold text-text-heading tracking-wider my-1 truncate">
            {activeStep?.M || '0'.repeat(bitWidth + 1)}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Decimal: {divisor}
          </div>
        </div>

        {/* Counter */}
        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-emerald mb-1 flex items-center justify-between">
            <span>Sequence Count</span>
            <span className="text-[10px] bg-accent-emerald/10 px-1.5 py-0.5 rounded font-mono font-bold">SC</span>
          </div>
          <div className="font-mono text-2xl font-black text-accent-emerald tracking-widest my-1 text-center">
            {activeStep?.count ?? bitWidth}
          </div>
          <div className="text-[11px] text-text-muted font-mono text-center">
            Cycle: {activeStep?.cycle || 0} / {bitWidth}
          </div>
        </div>
      </div>

      {/* Live Explanation Card */}
      <ExplanationCard
        title={activeStep?.opDescription || 'Division Step'}
        badge={activeStep?.operation}
        badgeColor={
          activeStep?.operation === 'RESTORE' ? 'rose' :
          activeStep?.operation === 'SUBTRACT_M' ? 'amber' :
          activeStep?.operation === 'SET_Q0' ? 'emerald' : 'cyan'
        }
        actionTaken={activeStep?.actionTaken}
        explanation={activeStep?.explanation || ''}
        formula={`Dividend (${dividend}) = Divisor (${divisor}) × Quotient (${divisionResult.quotientDecimal}) + Remainder (${divisionResult.remainderDecimal})`}
      />

      {/* Live State Table */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-sm text-text-heading flex items-center gap-2">
            <Binary className="w-4 h-4 text-accent-primary" />
            {algorithm === 'restoring' ? 'Restoring' : 'Non-Restoring'} Division Execution Table
          </h3>
          <span className="text-xs text-text-muted font-mono font-bold">
            {steps.length} discrete micro-operations
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-main">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-card-surface text-text-muted uppercase tracking-wider border-b border-border-main font-bold">
              <tr>
                <th className="p-2.5 text-center">#</th>
                <th className="p-2.5">Cycle</th>
                <th className="p-2.5">Operation</th>
                <th className="p-2.5">A (Acc)</th>
                <th className="p-2.5">Q (Quotient)</th>
                <th className="p-2.5">Count</th>
                <th className="p-2.5">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {steps.map((st, idx) => {
                const isActive = idx === currentStep;
                return (
                  <tr
                    key={idx}
                    onClick={() => handleSeek(idx)}
                    className={`cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-accent-primary/10 text-text-heading font-bold border-l-4 border-accent-primary'
                        : 'hover:bg-card-surface text-text-body'
                    }`}
                  >
                    <td className="p-2.5 text-center text-text-faint">{st.stepIndex}</td>
                    <td className="p-2.5">{st.cycle}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        st.operation === 'RESTORE' ? 'bg-accent-rose/10 text-accent-rose' :
                        st.operation === 'SUBTRACT_M' ? 'bg-accent-amber/10 text-accent-amber' :
                        st.operation === 'SET_Q0' ? 'bg-accent-emerald/10 text-accent-emerald' :
                        st.operation === 'FINAL' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-card-surface text-text-muted'
                      }`}>
                        {st.operation}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold tracking-wider text-accent-primary">{st.A}</td>
                    <td className="p-2.5 font-bold tracking-wider text-accent-amber">{st.Q}</td>
                    <td className="p-2.5 text-accent-emerald">{st.count}</td>
                    <td className="p-2.5 text-text-body truncate max-w-xs">{st.actionTaken}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controller Bar */}
      <ControllerBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        onJumpToStart={handleReset}
        onJumpToEnd={() => handleSeek(totalSteps - 1)}
        onSeekStep={handleSeek}
        phases={timelinePhases}
        speed={speed}
        onChangeSpeed={setSpeed}
        statusText={`${algorithm === 'restoring' ? 'Restoring' : 'Non-Restoring'}: ${dividend} ÷ ${divisor} = Q:${divisionResult.quotientDecimal}, R:${divisionResult.remainderDecimal}`}
      />
    </div>
  );
};
