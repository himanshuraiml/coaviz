import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateBoothSteps, BoothResult, getRequiredBitWidth } from '../../../engines/arithmetic/booth.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { Binary, Sparkles, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const BoothSimulator: React.FC = () => {
  const [multiplicand, setMultiplicand] = usePersistentState<number>('booth_m', 7);
  const [multiplier, setMultiplier] = usePersistentState<number>('booth_q', 3);
  const [bitWidth, setBitWidth] = usePersistentState<number>('booth_bits', 5);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Practice & Predict Mode state
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [practiceResult, setPracticeResult] = useState<'correct' | 'wrong' | null>(null);

  // Compute booth simulation steps
  const boothResult: BoothResult = useMemo(() => {
    const required = getRequiredBitWidth(multiplicand, multiplier);
    const chosenBits = Math.max(bitWidth, required);
    return generateBoothSteps(multiplicand, multiplier, chosenBits);
  }, [multiplicand, multiplier, bitWidth]);

  const steps = boothResult.steps;
  const totalSteps = steps.length;
  const activeStep = steps[currentStep] || steps[0];
  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    return {
      title: "Booth's Multiplier Simulation Trace",
      subtitle: `Multiplication of ${multiplicand} × ${multiplier} (${bitWidth}-bit 2's Complement)`,
      parameters: {
        'Multiplicand (M)': multiplicand,
        'Multiplier (Q)': multiplier,
        'Bit Width (n)': bitWidth,
        'Expected Product': multiplicand * multiplier,
      },
      columns: [
        { key: 'stepIndex', header: 'Step' },
        { key: 'cycle', header: 'Cycle' },
        { key: 'operation', header: 'Operation' },
        { key: 'A', header: 'Accumulator (A)' },
        { key: 'Q', header: 'Multiplier (Q)' },
        { key: 'qMinus1', header: 'Q-1' },
        { key: 'count', header: 'Count' },
        { key: 'actionTaken', header: 'Action' },
      ],
      rows: steps.map((s) => ({
        stepIndex: s.stepIndex,
        cycle: s.cycle,
        operation: s.operation,
        A: s.A,
        Q: s.Q,
        qMinus1: s.qMinus1,
        count: s.count,
        actionTaken: s.actionTaken,
      })),
      conclusion: `Final Product = ${multiplicand * multiplier} (Binary: ${activeStep?.A || ''}${activeStep?.Q || ''})`,
    };
  }, [multiplicand, multiplier, bitWidth, steps, activeStep]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return steps.map((s, idx) => ({
      stepIndex: idx,
      label: s.operation === 'INITIAL' ? 'Init' : s.operation === 'ASR' ? `ASR C${s.cycle}` : s.operation,
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

  // Confetti on final step completion
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

  // Practice prediction handler
  const handlePracticeChoice = (choice: string) => {
    setPracticeAnswer(choice);
    // Find expected next operation
    const nextStep = steps[currentStep + 1];
    if (!nextStep) return;

    let expected = 'NO_OP';
    if (nextStep.operation === 'ADD_M') expected = 'ADD_M';
    else if (nextStep.operation === 'SUB_M') expected = 'SUB_M';
    else if (nextStep.operation === 'ASR') expected = 'ASR';

    if (choice === expected || (choice === 'ASR' && nextStep.operation === 'ASR')) {
      setPracticeResult('correct');
    } else {
      setPracticeResult('wrong');
    }
  };

  const presets = [
    { label: '7 × 3 (+ × +)', m: 7, q: 3, bits: 5 },
    { label: '7 × -3 (+ × -)', m: 7, q: -3, bits: 5 },
    { label: '-7 × 3 (- × +)', m: -7, q: 3, bits: 5 },
    { label: '-7 × -3 (- × -)', m: -7, q: -3, bits: 5 },
    { label: '11 × 5', m: 11, q: 5, bits: 5 },
    { label: '-9 × 4', m: -9, q: 4, bits: 6 },
    { label: 'Max 8-bit Test', m: 127, q: -128, bits: 8 },
  ];

  // State diff detection for glowing changes
  const isAChanged = prevStep && prevStep.A !== activeStep.A;
  const isQChanged = prevStep && prevStep.Q !== activeStep.Q;
  const isQ1Changed = prevStep && prevStep.qMinus1 !== activeStep.qMinus1;

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* Input Configuration & Preset Selection */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Preset quick buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setMultiplicand(p.m);
                setMultiplier(p.q);
                setBitWidth(p.bits);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                multiplicand === p.m && multiplier === p.q
                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm font-black'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-xs'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Action Right: Practice Mode Toggle & Export */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Practice Mode Toggle */}
          <button
            onClick={() => setIsPracticeMode(!isPracticeMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isPracticeMode
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm font-black'
                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Practice Mode</span>
          </button>

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix="booth-multiplier" />
        </div>
      </div>

      {/* Input Parameters Bar */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Multiplicand (M):</label>
            <input
              type="number"
              value={multiplicand}
              onChange={(e) => {
                setMultiplicand(parseInt(e.target.value) || 0);
                setCurrentStep(0);
              }}
              className="w-16 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-sm font-bold text-accent-primary text-center focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Multiplier (Q):</label>
            <input
              type="number"
              value={multiplier}
              onChange={(e) => {
                setMultiplier(parseInt(e.target.value) || 0);
                setCurrentStep(0);
              }}
              className="w-16 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-sm font-bold text-accent-amber text-center focus:outline-none focus:border-accent-amber"
            />
          </div>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Bit Width (n):</label>
            <select
              value={bitWidth}
              onChange={(e) => {
                setBitWidth(parseInt(e.target.value));
                setCurrentStep(0);
              }}
              className="bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-sm font-bold text-text-heading focus:outline-none focus:border-accent-primary"
            >
              {[4, 5, 6, 7, 8].map((b) => (
                <option key={b} value={b}>{b} bits</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-text-muted">
          Expected Product: <span className="text-accent-emerald font-extrabold">{multiplicand * multiplier}</span>
        </div>
      </div>

      {/* Practice / Predict Mode Interactive Banner */}
      {isPracticeMode && currentStep < totalSteps - 1 && (
        <div className="bg-indigo-500/10 border-2 border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs uppercase font-black tracking-wider text-indigo-500">
                Practice Challenge
              </span>
              <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                Pair: {activeStep?.Q ? activeStep.Q[activeStep.Q.length - 1] : '0'}{activeStep?.qMinus1 || '0'}
              </span>
            </div>
            <p className="text-sm font-bold text-text-heading">
              Based on the current bit pair Q₀Q₋₁, what is the correct next operation?
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {[
              { label: 'A = A - M (Sub M)', id: 'SUB_M' },
              { label: 'A = A + M (Add M)', id: 'ADD_M' },
              { label: 'Arithmetic Shift Right (ASR)', id: 'ASR' },
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
                  <span>Incorrect. Check Q₀Q₋₁ rule!</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Simulation Viewport: Register Bank */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Register A (Accumulator) */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          isAChanged
            ? 'border-accent-primary ring-2 ring-accent-primary/40 bg-accent-primary/5'
            : 'border-border-main'
        }`}>
          <div className="text-xs font-bold text-accent-primary mb-1 flex items-center justify-between">
            <span>Accumulator (A)</span>
            <span className="text-[10px] bg-accent-primary/10 px-1.5 py-0.5 rounded font-mono font-bold">{activeStep?.A?.length || bitWidth}b</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-text-heading tracking-widest my-1 truncate">
            {activeStep?.A || '0'.repeat(bitWidth)}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Dec: {activeStep ? parseInt(activeStep.A, 2) : 0}
          </div>
        </div>

        {/* Register Q (Multiplier) */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          isQChanged
            ? 'border-accent-amber ring-2 ring-accent-amber/40 bg-accent-amber/5'
            : 'border-border-main'
        }`}>
          <div className="text-xs font-bold text-accent-amber mb-1 flex items-center justify-between">
            <span>Multiplier (Q)</span>
            <span className="text-[10px] bg-accent-amber/10 px-1.5 py-0.5 rounded font-mono font-bold">{activeStep?.Q?.length || bitWidth}b</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-text-heading tracking-widest my-1 truncate">
            {activeStep?.Q || '0'.repeat(bitWidth)}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Q₀ bit: <span className="font-bold text-accent-amber">{activeStep?.Q ? activeStep.Q[activeStep.Q.length - 1] : '0'}</span>
          </div>
        </div>

        {/* Register Q-1 */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          isQ1Changed
            ? 'border-accent-rose ring-2 ring-accent-rose/40 bg-accent-rose/5'
            : 'border-border-main'
        }`}>
          <div className="text-xs font-bold text-accent-rose mb-1 flex items-center justify-between">
            <span>Q₋₁ (Previous bit)</span>
            <span className="text-[10px] bg-accent-rose/10 px-1.5 py-0.5 rounded font-mono font-bold">1b</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-accent-rose tracking-widest my-1 text-center">
            {activeStep?.qMinus1 || '0'}
          </div>
          <div className="text-[11px] text-text-muted font-mono text-center">
            Pair Q₀Q₋₁: <span className="font-bold text-text-heading">{activeStep?.Q ? activeStep.Q[activeStep.Q.length - 1] : '0'}{activeStep?.qMinus1 || '0'}</span>
          </div>
        </div>

        {/* Multiplicand M */}
        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-secondary mb-1 flex items-center justify-between">
            <span>Multiplicand (M)</span>
            <span className="text-[10px] bg-accent-secondary/10 px-1.5 py-0.5 rounded font-mono font-bold">{bitWidth}b</span>
          </div>
          <div className="font-mono text-lg sm:text-xl font-bold text-text-heading tracking-wider my-1 truncate">
            {activeStep?.M || '0'.repeat(bitWidth)}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Decimal: {multiplicand}
          </div>
        </div>

        {/* -M (2's Comp M) */}
        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center justify-between">
            <span>-M (2's Comp M)</span>
            <span className="text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded font-mono font-bold">{bitWidth}b</span>
          </div>
          <div className="font-mono text-lg sm:text-xl font-bold text-text-heading tracking-wider my-1 truncate">
            {activeStep?.negM || '0'.repeat(bitWidth)}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Decimal: {-multiplicand}
          </div>
        </div>

        {/* Sequence Counter */}
        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-emerald mb-1 flex items-center justify-between">
            <span>Count</span>
            <span className="text-[10px] bg-accent-emerald/10 px-1.5 py-0.5 rounded font-mono font-bold">SC</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-accent-emerald tracking-widest my-1 text-center">
            {activeStep?.count ?? bitWidth}
          </div>
          <div className="text-[11px] text-text-muted font-mono text-center">
            Cycle: {activeStep?.cycle || 0} / {bitWidth}
          </div>
        </div>
      </div>

      {/* Live Explanation & Active Operation Card */}
      <ExplanationCard
        title={activeStep?.opDescription || 'Simulation Step'}
        badge={activeStep?.operation}
        badgeColor={
          activeStep?.operation === 'ADD_M' ? 'cyan' :
          activeStep?.operation === 'SUB_M' ? 'rose' :
          activeStep?.operation === 'ASR' ? 'amber' :
          activeStep?.operation === 'FINAL' ? 'emerald' : 'indigo'
        }
        actionTaken={activeStep?.actionTaken}
        explanation={activeStep?.explanation || ''}
        formula={`Result = ${multiplicand} × ${multiplier} = ${multiplicand * multiplier} (Binary: ${activeStep?.A || ''}${activeStep?.Q || ''})`}
        subNotes={[
          'Rule: Q₀Q₋₁ = 10 ➔ Subtract M (A ← A - M); Q₀Q₋₁ = 01 ➔ Add M (A ← A + M); Q₀Q₋₁ = 00 or 11 ➔ No-Op.',
          'Arithmetic Shift Right (ASR) preserves the sign bit (A[MSB]) while shifting all bits right.',
        ]}
      />

      {/* Live State Table Tracking All Cycles */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-sm text-text-heading flex items-center gap-2">
            <Binary className="w-4 h-4 text-accent-primary" />
            Booth's Multiplication Step-by-Step Table
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
                <th className="p-2.5">A</th>
                <th className="p-2.5">Q</th>
                <th className="p-2.5 text-center">Q₋₁</th>
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
                        st.operation === 'ADD_M' ? 'bg-accent-primary/10 text-accent-primary' :
                        st.operation === 'SUB_M' ? 'bg-accent-rose/10 text-accent-rose' :
                        st.operation === 'ASR' ? 'bg-accent-amber/10 text-accent-amber' :
                        st.operation === 'FINAL' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-card-surface text-text-muted'
                      }`}>
                        {st.operation}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold tracking-wider text-accent-primary">{st.A}</td>
                    <td className="p-2.5 font-bold tracking-wider text-accent-amber">{st.Q}</td>
                    <td className="p-2.5 text-center font-bold text-accent-rose">{st.qMinus1}</td>
                    <td className="p-2.5 text-accent-emerald">{st.count}</td>
                    <td className="p-2.5 text-text-body truncate max-w-xs">{st.actionTaken}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal Floating Controller Bar */}
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
        statusText={`Booth: ${multiplicand} × ${multiplier} = ${multiplicand * multiplier} (${activeStep?.opDescription || ''})`}
      />
    </div>
  );
};
