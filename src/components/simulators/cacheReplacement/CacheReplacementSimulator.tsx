import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  simulateCacheReplacement, 
  PRESET_ACCESS_PATTERNS, 
  ReplacementPolicy, 
  ReplacementSimulationResult 
} from '../../../engines/memory/cacheReplacement.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { 
  HardDrive, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  History, 
  TrendingUp 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const CacheReplacementSimulator: React.FC = () => {
  const [policy, setPolicy] = usePersistentState<ReplacementPolicy>('cache_rep_policy', 'LRU');
  const [selectedPresetIndex, setSelectedPresetIndex] = usePersistentState<number>('cache_rep_preset', 0);
  const [capacity, setCapacity] = usePersistentState<number>('cache_rep_cap', 4);
  
  const [sequence, setSequence] = useState<number[]>(
    PRESET_ACCESS_PATTERNS[selectedPresetIndex]?.sequence || PRESET_ACCESS_PATTERNS[0].sequence
  );
  const [customInputText, setCustomInputText] = useState<string>(
    (PRESET_ACCESS_PATTERNS[selectedPresetIndex]?.sequence || PRESET_ACCESS_PATTERNS[0].sequence).join(', ')
  );

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Compute Simulation Result
  const simResult: ReplacementSimulationResult = useMemo(() => {
    return simulateCacheReplacement(sequence, capacity, policy);
  }, [sequence, capacity, policy]);

  const steps = simResult.steps;
  const totalSteps = steps.length;
  const activeStep = steps[currentStepIndex] || steps[0];

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    const presetName = PRESET_ACCESS_PATTERNS[selectedPresetIndex]?.name || 'Custom Sequence';
    return {
      title: `Cache Replacement Policy Trace (${policy})`,
      subtitle: `Pattern: ${presetName} | Capacity: ${capacity} Slots | Hit Ratio: ${simResult.finalHitRatio}%`,
      parameters: {
        'Policy': `${policy} (Algorithm)`,
        'Cache Capacity': `${capacity} Slots`,
        'Total Accesses': sequence.length,
        'Hits': simResult.totalHits,
        'Misses': simResult.totalMisses,
        'Final Hit Ratio': `${simResult.finalHitRatio}%`,
      },
      columns: [
        { key: 'stepNumber', header: 'Step #' },
        { key: 'tagAccessed', header: 'Requested Tag' },
        { key: 'outcome', header: 'Hit / Miss' },
        { key: 'slotAction', header: 'Slot Allocation' },
        { key: 'hitRatio', header: 'Hit Ratio (%)' },
        { key: 'actionTaken', header: 'Action Summary' },
      ],
      rows: steps.map((s) => ({
        stepNumber: s.stepNumber,
        tagAccessed: `Tag ${s.tagAccessed}`,
        outcome: s.isHit ? 'HIT' : 'MISS',
        slotAction: s.isHit
          ? `Slot #${s.hitSlotIndex}`
          : s.evictedSlotIndex !== undefined
          ? `Evicted #${s.evictedSlotIndex} (Tag ${s.evictedTag})`
          : 'Loaded Free Slot',
        hitRatio: `${s.hitRatio}%`,
        actionTaken: s.actionTaken,
      })),
      conclusion: `Final Performance: ${simResult.totalHits} Hits, ${simResult.totalMisses} Misses (${simResult.finalHitRatio}% Hit Ratio)`,
    };
  }, [policy, selectedPresetIndex, capacity, simResult, sequence, steps]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return steps.map((s, idx) => ({
      stepIndex: idx,
      label: `T${s.tagAccessed} (${s.isHit ? 'Hit' : 'Miss'})`,
      category: s.isHit ? 'result' : 'compute',
    }));
  }, [steps]);

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      const intervalMs = Math.max(300, 1500 / speed);
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
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

  // Confetti on final step if hit ratio > 50%
  useEffect(() => {
    if (currentStepIndex === totalSteps - 1 && totalSteps > 0 && simResult.finalHitRatio >= 50) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  }, [currentStepIndex, totalSteps, simResult.finalHitRatio]);

  const handleStepForward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const handleStepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const handleSeek = useCallback((stepIdx: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(totalSteps - 1, stepIdx)));
  }, [totalSteps]);

  const handlePresetSelect = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = PRESET_ACCESS_PATTERNS[idx];
    setSequence(p.sequence);
    setCustomInputText(p.sequence.join(', '));
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleApplyCustomSequence = () => {
    const parsed = customInputText
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    if (parsed.length > 0) {
      setSequence(parsed);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* Top Configuration & Presets */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Policy Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {(['LRU', 'FIFO', 'LFU'] as ReplacementPolicy[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPolicy(p);
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                policy === p
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
              }`}
            >
              {p} Policy
            </button>
          ))}
        </div>

        {/* Capacity & Custom Sequence Input */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Slots:</label>
            <select
              value={capacity}
              onChange={(e) => {
                setCapacity(parseInt(e.target.value));
                setCurrentStepIndex(0);
              }}
              className="bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-xs font-bold text-text-heading focus:outline-none focus:border-accent-primary"
            >
              {[3, 4, 6, 8].map((c) => (
                <option key={c} value={c}>{c} Slots</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main flex-1 lg:flex-none">
            <label className="text-xs font-bold text-text-muted">Sequence:</label>
            <input
              type="text"
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
              onBlur={handleApplyCustomSequence}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomSequence()}
              className="w-40 sm:w-48 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-xs text-accent-primary font-bold focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix={`cache-replacement-${policy}`} />
        </div>
      </div>

      {/* Preset Reference Streams */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Presets:
        </span>
        {PRESET_ACCESS_PATTERNS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetSelect(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedPresetIndex === idx
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm font-black'
                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-xs'
            }`}
          >
            {p.name.split(' ')[0]} {p.name.split(' ')[1]}
          </button>
        ))}
      </div>

      {/* Hit / Miss Metrics & Live Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Cumulative Hits */}
        <div className="bg-card-bg border border-accent-emerald/30 bg-accent-emerald/5 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-emerald mb-1 flex items-center justify-between">
            <span>Cache Hits</span>
            <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
          </div>
          <div className="text-3xl font-black text-accent-emerald font-mono my-1">
            {activeStep?.cumulativeHits ?? 0}
          </div>
          <div className="text-[11px] text-text-muted">Total successful accesses</div>
        </div>

        {/* Cumulative Misses */}
        <div className="bg-card-bg border border-accent-rose/30 bg-accent-rose/5 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-rose mb-1 flex items-center justify-between">
            <span>Cache Misses</span>
            <XCircle className="w-4 h-4 text-accent-rose" />
          </div>
          <div className="text-3xl font-black text-accent-rose font-mono my-1">
            {activeStep?.cumulativeMisses ?? 0}
          </div>
          <div className="text-[11px] text-text-muted">Main memory fetches / evictions</div>
        </div>

        {/* Current Hit Ratio */}
        <div className="bg-card-bg border border-accent-primary/30 bg-accent-primary/5 rounded-2xl p-4 shadow-sm sm:col-span-2">
          <div className="text-xs font-bold text-accent-primary mb-1 flex items-center justify-between">
            <span>Hit Ratio (%)</span>
            <TrendingUp className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="flex items-center gap-4 my-1">
            <span className="text-3xl font-black text-accent-primary font-mono">
              {activeStep?.hitRatio ?? 0}%
            </span>
            <div className="flex-1 bg-card-surface rounded-full h-3 overflow-hidden border border-border-main">
              <div
                className="bg-gradient-to-r from-accent-primary to-accent-emerald h-full transition-all duration-300 rounded-full"
                style={{ width: `${activeStep?.hitRatio ?? 0}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-text-muted">
            Current step: #{activeStep?.stepNumber || 1} of {totalSteps} accesses
          </div>
        </div>
      </div>

      {/* Live Cache Slots Visual Matrix */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-border-main pb-2.5">
          <h3 className="font-extrabold text-sm text-text-heading flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-accent-primary" />
            Active Cache Slots State ({policy} Algorithm)
          </h3>
          <span className="text-xs font-mono text-accent-primary font-bold">
            Accessing: <strong className="text-text-heading">{activeStep?.tagLabel || ''}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(activeStep?.slots || []).map((slot) => {
            return (
              <div
                key={slot.index}
                className={`p-4 rounded-xl border transition-all ${
                  slot.isHitSlot
                    ? 'border-accent-emerald bg-accent-emerald/10 shadow-md shadow-accent-emerald/20 scale-105'
                    : slot.isEvictedSlot
                    ? 'border-accent-amber bg-accent-amber/10 shadow-md shadow-accent-amber/20 scale-105'
                    : slot.valid
                    ? 'bg-card-surface border-border-main'
                    : 'bg-card-surface border-border-main opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-text-heading">Slot #{slot.index}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    slot.isHitSlot ? 'bg-accent-emerald/20 text-accent-emerald' :
                    slot.isEvictedSlot ? 'bg-accent-amber/20 text-accent-amber' :
                    slot.valid ? 'bg-accent-primary/15 text-accent-primary' : 'bg-card-bg text-text-faint'
                  }`}>
                    {slot.isHitSlot ? 'HIT' : slot.isEvictedSlot ? 'EVICTED & LOADED' : slot.valid ? 'OCCUPIED' : 'EMPTY'}
                  </span>
                </div>

                <div className="font-mono text-xl font-black text-text-heading mb-2 truncate">
                  {slot.valid ? `Block [${slot.tag}]` : 'Empty'}
                </div>

                <div className="space-y-1 text-xs font-mono text-text-muted">
                  {policy === 'LRU' && (
                    <div className="flex justify-between">
                      <span>Last Access T:</span>
                      <span className="text-accent-primary font-bold">t = {slot.lruTimestamp}</span>
                    </div>
                  )}
                  {policy === 'FIFO' && (
                    <div className="flex justify-between">
                      <span>Arrived at T:</span>
                      <span className="text-accent-amber font-bold">t = {slot.fifoInsertionOrder}</span>
                    </div>
                  )}
                  {policy === 'LFU' && (
                    <div className="flex justify-between">
                      <span>Frequency:</span>
                      <span className="text-accent-emerald font-bold">{slot.lfuAccessCount} hits</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Explanation Card */}
      <ExplanationCard
        title={activeStep?.actionTaken || 'Replacement Step'}
        badge={activeStep?.isHit ? 'HIT' : 'MISS'}
        badgeColor={activeStep?.isHit ? 'emerald' : 'amber'}
        actionTaken={activeStep?.actionTaken}
        explanation={activeStep?.explanation || ''}
        formula={`Hit Ratio = (${activeStep?.cumulativeHits || 0} Hits / ${activeStep?.stepNumber || 1} Total) × 100% = ${activeStep?.hitRatio || 0}%`}
        subNotes={[
          'LRU (Least Recently Used): Evicts block untouched for the longest time (optimal for temporal locality).',
          'FIFO (First-In First-Out): Evicts the oldest arrived block regardless of usage frequency.',
          'LFU (Least Frequently Used): Evicts block with smallest access count.',
        ]}
      />

      {/* Step History Timeline Table */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-border-main pb-2.5">
          <h3 className="font-extrabold text-sm text-text-heading flex items-center gap-2">
            <History className="w-4 h-4 text-accent-primary" />
            Access Sequence Trace & Evaluation History
          </h3>
          <span className="text-xs text-text-muted font-mono font-bold">
            {sequence.length} Total Memory References
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-main">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-card-surface text-text-muted uppercase tracking-wider border-b border-border-main font-bold">
              <tr>
                <th className="p-2.5 text-center">#</th>
                <th className="p-2.5">Requested Tag</th>
                <th className="p-2.5">Outcome</th>
                <th className="p-2.5">Target / Evicted Slot</th>
                <th className="p-2.5">Hit Ratio</th>
                <th className="p-2.5">Action Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {steps.map((st, idx) => {
                const isActive = idx === currentStepIndex;
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
                    <td className="p-2.5 text-center text-text-faint">{st.stepNumber}</td>
                    <td className="p-2.5 font-bold text-accent-primary">Tag {st.tagAccessed}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        st.isHit ? 'bg-accent-emerald/15 text-accent-emerald' : 'bg-accent-rose/15 text-accent-rose'
                      }`}>
                        {st.isHit ? 'HIT' : 'MISS'}
                      </span>
                    </td>
                    <td className="p-2.5 text-text-body font-medium">
                      {st.isHit
                        ? `Slot #${st.hitSlotIndex}`
                        : st.evictedSlotIndex !== undefined
                        ? `Evicted #${st.evictedSlotIndex} (Tag ${st.evictedTag})`
                        : 'Loaded in Free Slot'}
                    </td>
                    <td className="p-2.5 font-bold text-accent-primary">{st.hitRatio}%</td>
                    <td className="p-2.5 text-text-muted truncate max-w-xs">{st.actionTaken}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Presentation Controller Bar */}
      <ControllerBar
        currentStep={currentStepIndex}
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
        statusText={`Cache Replacement (${policy}): Step ${currentStepIndex + 1} of ${totalSteps}`}
      />
    </div>
  );
};
