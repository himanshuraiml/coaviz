import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  simulateCacheMapping, 
  initializeEmptyCache, 
  CacheConfig, 
  MappingType, 
  CacheLineSlot, 
  CacheMappingResult 
} from '../../../engines/memory/cacheMapping.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { XRayModal, XRayComponentType } from '../../schematic/XRayModal.tsx';
import { ClockWaveformTimeline } from '../../schematic/ClockWaveformTimeline.tsx';
import { CacheMappingDiagram } from './CacheMappingDiagram.tsx';
import { CacheComparator } from '../../comparative/CacheComparator.tsx';
import { 
  HardDrive, 
  Sparkles, 
  ZoomIn,
  Database,
  SplitSquareVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const CacheMappingSimulator: React.FC = () => {
  const [mappingType, setMappingType] = usePersistentState<MappingType>('cache_mapping', 'DIRECT');
  const [addressInput, setAddressInput] = usePersistentState<number>('cache_addr', 0x1A24);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // X-Ray inspector state
  const [xrayType, setXrayType] = useState<XRayComponentType | null>(null);

  const config: CacheConfig = useMemo(() => ({
    addressBits: 16,
    cacheSizeBytes: 256, // 16 lines of 16 bytes each
    blockSizeBytes: 16,
    mappingType,
  }), [mappingType]);

  const [cacheSlots, setCacheSlots] = useState<CacheLineSlot[]>(() => initializeEmptyCache(config));

  // Reset cache whenever mapping type changes
  useEffect(() => {
    setCacheSlots(initializeEmptyCache(config));
    setCurrentStepIndex(0);
  }, [config]);

  // Run simulation mapping
  const simResult: CacheMappingResult = useMemo(() => {
    return simulateCacheMapping(addressInput, config, cacheSlots);
  }, [addressInput, config, cacheSlots]);

  const steps = simResult.steps;
  const totalSteps = steps.length;
  const activeStep = steps[currentStepIndex] || steps[0];

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    return {
      title: `Cache Memory Mapping Trace (${mappingType})`,
      subtitle: `Address: 0x${addressInput.toString(16).toUpperCase()} | Status: ${simResult.isHit ? 'CACHE HIT' : 'CACHE MISS'}`,
      parameters: {
        'Mapping Scheme': mappingType,
        'Memory Address': `0x${addressInput.toString(16).toUpperCase()}`,
        'Tag Bits': `${simResult.decomposition.tagBitsCount}b (${simResult.decomposition.tagBinary})`,
        'Index Bits': `${simResult.decomposition.indexBitsCount}b (${simResult.decomposition.indexBinary})`,
        'Offset Bits': `${simResult.decomposition.offsetBitsCount}b (${simResult.decomposition.offsetBinary})`,
        'Outcome': simResult.isHit ? 'CACHE HIT' : 'CACHE MISS',
      },
      columns: [
        { key: 'step', header: 'Step #' },
        { key: 'phase', header: 'Phase' },
        { key: 'title', header: 'Operation' },
        { key: 'description', header: 'Description' },
      ],
      rows: steps.map((s) => ({
        step: s.stepIndex,
        phase: s.phase,
        title: s.title,
        description: s.description,
      })),
      conclusion: `Address 0x${addressInput.toString(16).toUpperCase()} mapped to ${simResult.isHit ? 'HIT in Cache Slot #' + simResult.hitSlotIndex : 'MISS (Fetched block from DRAM)'}`,
    };
  }, [mappingType, addressInput, simResult, steps]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return steps.map((s, idx) => ({
      stepIndex: idx,
      label: s.phase === 'PARSE_ADDRESS' ? 'Split' : s.phase === 'LOCATE_SET_LINE' ? 'Set/Line' : s.phase === 'COMPARE_TAG' ? 'Tag' : 'Result',
      category: s.phase === 'RESULT_HIT_MISS' ? 'result' : 'compute',
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

  // Confetti on cache hit on last step
  useEffect(() => {
    if (currentStepIndex === totalSteps - 1 && simResult.isHit) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  }, [currentStepIndex, totalSteps, simResult.isHit]);

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

  const handleApplyAddress = (addr: number) => {
    setAddressInput(addr);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleCommitToCache = () => {
    setCacheSlots(simResult.cacheState);
    setCurrentStepIndex(0);
  };

  const handleClearCache = () => {
    setCacheSlots(initializeEmptyCache(config));
    setCurrentStepIndex(0);
  };

  const [isComparativeView, setIsComparativeView] = useState<boolean>(false);

  // Probe presets
  const probePresets = [
    { label: '0x1A20 (Base Block)', addr: 0x1A20 },
    { label: '0x1A24 (Same Line Hit)', addr: 0x1A24 },
    { label: '0x2A20 (Conflict Miss)', addr: 0x2A20 },
    { label: '0x3B40 (Diff Set)', addr: 0x3B40 },
    { label: '0x00F8 (Low Addr)', addr: 0x00F8 },
  ];

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* X-Ray Cutaway Modal */}
      {xrayType && (
        <XRayModal
          isOpen={!!xrayType}
          onClose={() => setXrayType(null)}
          componentType={xrayType}
          activeData={{
            tagInput: `0x${simResult.decomposition.tagValue.toString(16).toUpperCase()}`,
            storedTag: simResult.hitSlotIndex !== undefined ? cacheSlots[simResult.hitSlotIndex]?.tagHex : '0x??',
            isHit: simResult.isHit,
          }}
        />
      )}

      {/* Top Configuration & Presets Header */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Mapping Scheme Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {[
            { id: 'DIRECT' as MappingType, label: 'Direct' },
            { id: 'SET_ASSOCIATIVE_2WAY' as MappingType, label: '2-Way Set' },
            { id: 'SET_ASSOCIATIVE_4WAY' as MappingType, label: '4-Way Set' },
            { id: 'ASSOCIATIVE' as MappingType, label: 'Fully Associative' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMappingType(m.id);
                setCurrentStepIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mappingType === m.id
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Custom Address Probe & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Comparative Mode Button */}
          <button
            onClick={() => setIsComparativeView(!isComparativeView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isComparativeView
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black'
                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Comparative View</span>
          </button>

          {/* X-Ray Cutaway Buttons */}
          <button
            onClick={() => setXrayType('CACHE_TAG_COMPARATOR')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Tag Comparator</span>
          </button>

          <button
            onClick={() => setXrayType('SRAM_CELL')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>6T SRAM</span>
          </button>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Addr (Hex):</label>
            <input
              type="text"
              value={`0x${addressInput.toString(16).toUpperCase()}`}
              onChange={(e) => {
                const val = parseInt(e.target.value, 16);
                if (!isNaN(val)) handleApplyAddress(val);
              }}
              className="w-20 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-xs text-accent-primary text-center font-bold focus:outline-none focus:border-accent-primary"
            />
          </div>

          <button
            onClick={handleCommitToCache}
            title="Update cache contents after miss/hit"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm cursor-pointer"
          >
            Update Slot
          </button>

          <button
            onClick={handleClearCache}
            title="Flush entire cache to empty"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm cursor-pointer"
          >
            Clear
          </button>

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix={`cache-mapping-${mappingType}`} />
        </div>
      </div>

      {/* Side-by-Side Comparative View Component */}
      {isComparativeView && (
        <CacheComparator address={addressInput} />
      )}

      {/* Preset Address Quick Probes */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-text-muted flex items-center gap-1.5 mr-1 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Test Probes:
        </span>
        {probePresets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleApplyAddress(p.addr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
              addressInput === p.addr
                ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm font-black'
                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-xs'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Real-time Oscilloscope Timing & Waveform Analyzer */}
      <ClockWaveformTimeline
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        timingSignal={`Step ${currentStepIndex + 1}`}
        phaseLabel={activeStep?.phase === 'RESULT_HIT_MISS' ? (simResult.isHit ? 'CACHE HIT' : 'CACHE MISS') : 'TAG LOOKUP'}
        activeSignals={{
          clk: isPlaying || true,
          read: true,
          write: !simResult.isHit && activeStep?.phase === 'RESULT_HIT_MISS',
          load: simResult.isHit,
        }}
        onStepSelect={(s) => {
          setIsPlaying(false);
          setCurrentStepIndex(s);
        }}
      />

      {/* Animated SVG Cache Mapping Diagram */}
      <CacheMappingDiagram
        result={simResult}
        activeStep={activeStep}
        stepIndex={currentStepIndex}
        cacheSlots={cacheSlots}
        addressInput={addressInput}
        mappingType={mappingType}
        onClickBlock={(block) => {
          if (block === 'CACHE_TAG_COMPARATOR') setXrayType('CACHE_TAG_COMPARATOR');
          else if (block === 'SRAM_CELL') setXrayType('SRAM_CELL');
        }}
      />

      {/* Live Explanation Card */}
      <ExplanationCard
        title={activeStep?.title || 'Cache Mapping Step'}
        badge={`Step ${activeStep?.stepIndex || 1} / ${totalSteps}`}
        badgeColor={
          activeStep?.phase === 'RESULT_HIT_MISS'
            ? simResult.isHit ? 'emerald' : 'rose'
            : 'cyan'
        }
        actionTaken={activeStep?.description}
        explanation={activeStep?.explanation || ''}
        formula={`Address = (Tag << ${simResult.decomposition.indexBitsCount + simResult.decomposition.offsetBitsCount}) | (Index << ${simResult.decomposition.offsetBitsCount}) | Offset`}
        subNotes={[
          'Direct Mapping: Line = (Block Address) mod (Number of Cache Lines). Fast 1-cycle lookup, but prone to conflict misses.',
          'Set Associative: Set = (Block Address) mod (Number of Sets). Balanced latency and conflict reduction.',
        ]}
      />

      {/* Cache Memory State Table */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-border-main pb-2.5">
          <h3 className="font-extrabold text-sm text-text-heading flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-accent-primary" />
            Cache Storage State Matrix ({cacheSlots.length} Slots)
          </h3>
          <span className="text-xs text-text-muted font-mono font-bold">
            {mappingType} Cache
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cacheSlots.map((slot) => {
            const isHighlighted = activeStep?.highlightSlotIndices?.includes(slot.slotIndex);
            const isHitMatch = simResult.isHit && simResult.hitSlotIndex === slot.slotIndex;

            return (
              <div
                key={slot.slotIndex}
                onClick={() => setXrayType('CACHE_TAG_COMPARATOR')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isHitMatch
                    ? 'border-accent-emerald bg-accent-emerald/10 shadow-md shadow-accent-emerald/20 scale-105'
                    : isHighlighted
                    ? 'border-accent-primary bg-accent-primary/10 scale-[1.02]'
                    : 'bg-card-surface border-border-main hover:border-text-muted'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-text-heading">
                    Slot #{slot.slotIndex} {slot.setIndex !== undefined && `(Set ${slot.setIndex})`}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    slot.valid ? 'bg-accent-emerald/15 text-accent-emerald' : 'bg-card-bg text-text-faint'
                  }`}>
                    {slot.valid ? 'Valid (V=1)' : 'Invalid (V=0)'}
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-text-muted">
                    <span>Stored Tag:</span>
                    <span className="font-bold text-accent-primary">{slot.tagHex}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Data Block:</span>
                    <span className="text-text-heading truncate max-w-[120px] font-bold">{slot.dataBlockPreview}</span>
                  </div>
                </div>
              </div>
            );
          })}
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
        statusText={`Cache Mapping: ${mappingType} — ${activeStep?.title || ''}`}
      />
    </div>
  );
};
