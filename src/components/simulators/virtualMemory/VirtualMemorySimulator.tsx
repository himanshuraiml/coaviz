import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  createInitialVMState, 
  simulateVirtualMemoryAccess, 
  VMConfig, 
  VMSimulationResult,
  TLBEntry,
  PageTableEntry,
  PhysicalFrame
} from '../../../engines/memory/virtualMemory.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { 
  Sparkles, 
  Database, 
  Layers, 
  ArrowRight, 
  Zap, 
  RotateCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const VirtualMemorySimulator: React.FC = () => {
  const config: VMConfig = useMemo(() => ({
    virtualAddressBits: 16,
    physicalAddressBits: 14,
    pageSizeBytes: 4096, // 4KB (12 offset bits)
    tlbSize: 4,
  }), []);

  const [initialState] = useState(() => createInitialVMState(config));
  const [tlbState, setTlbState] = useState<TLBEntry[]>(initialState.tlb);
  const [pageTableState, setPageTableState] = useState<PageTableEntry[]>(initialState.pageTable);
  const [ramFramesState, setRamFramesState] = useState<PhysicalFrame[]>(initialState.ramFrames);

  const [virtualAddress, setVirtualAddress] = usePersistentState<number>('vm_va', 0x0124);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Run Simulation
  const simResult: VMSimulationResult = useMemo(() => {
    return simulateVirtualMemoryAccess(
      virtualAddress,
      config,
      tlbState,
      pageTableState,
      ramFramesState
    );
  }, [virtualAddress, config, tlbState, pageTableState, ramFramesState]);

  const steps = simResult.steps;
  const totalSteps = steps.length;
  const activeStep = steps[currentStepIndex] || steps[0];

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    return {
      title: 'Virtual Memory & Page Table Address Translation Trace',
      subtitle: `VA: 0x${virtualAddress.toString(16).toUpperCase()} ➔ PA: 0x${simResult.physicalAddress.toString(16).toUpperCase()} (${simResult.isTLBHit ? 'TLB HIT' : simResult.isPageFault ? 'PAGE FAULT' : 'PAGE TABLE HIT'})`,
      parameters: {
        'Virtual Address': `0x${virtualAddress.toString(16).toUpperCase()}`,
        'Virtual Page # (VPN)': simResult.vpn,
        'Page Offset': `0x${simResult.offset.toString(16).toUpperCase()} (${simResult.offset} bytes)`,
        'TLB Result': simResult.isTLBHit ? 'HIT (1-cycle)' : 'MISS',
        'Page Table Status': simResult.isPageFault ? 'PAGE FAULT (Disk)' : 'HIT (In RAM)',
        'Physical Address': `0x${simResult.physicalAddress.toString(16).toUpperCase()}`,
      },
      columns: [
        { key: 'step', header: 'Step #' },
        { key: 'component', header: 'Hardware Component' },
        { key: 'title', header: 'Action' },
        { key: 'description', header: 'Micro-operation Description' },
      ],
      rows: steps.map((s) => ({
        step: s.stepIndex,
        component: s.activeComponent,
        title: s.title,
        description: s.description,
      })),
      conclusion: `Translated Virtual Address 0x${virtualAddress.toString(16).toUpperCase()} (Page ${simResult.vpn}) to Physical Address 0x${simResult.physicalAddress.toString(16).toUpperCase()}`,
    };
  }, [virtualAddress, simResult, steps]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return steps.map((s, idx) => ({
      stepIndex: idx,
      label: s.activeComponent,
      category: s.activeComponent === 'RAM' ? 'result' : 'compute',
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

  // Confetti on final step completion
  useEffect(() => {
    if (currentStepIndex === totalSteps - 1 && totalSteps > 0 && simResult.isTLBHit) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  }, [currentStepIndex, totalSteps, simResult.isTLBHit]);

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
    setVirtualAddress(addr);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleCommitUpdates = () => {
    setTlbState(simResult.tlbState);
    setPageTableState(simResult.pageTableState);
    setRamFramesState(simResult.ramFramesState);
    setCurrentStepIndex(0);
  };

  const handleResetAllVM = () => {
    const fresh = createInitialVMState(config);
    setTlbState(fresh.tlb);
    setPageTableState(fresh.pageTable);
    setRamFramesState(fresh.ramFrames);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const presets = [
    { label: '0x0124 (TLB Fast Hit)', addr: 0x0124 },
    { label: '0x2456 (TLB Miss ➔ Page Table Hit)', addr: 0x2456 },
    { label: '0x5789 (Page Fault ➔ Disk Swap)', addr: 0x5789 },
    { label: '0x8ABC (Page Fault ➔ Frame Evict)', addr: 0x8ABC },
  ];

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* Top Controls & Presets */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Preset Address Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyAddress(p.addr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                virtualAddress === p.addr
                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm font-black'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-xs'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom VA Input & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <label className="text-xs font-bold text-text-muted">Virtual Addr:</label>
            <input
              type="text"
              value={`0x${virtualAddress.toString(16).toUpperCase()}`}
              onChange={(e) => {
                const val = parseInt(e.target.value, 16);
                if (!isNaN(val)) handleApplyAddress(val);
              }}
              className="w-20 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-xs text-accent-primary text-center font-bold focus:outline-none focus:border-accent-primary"
            />
          </div>

          <button
            onClick={handleCommitUpdates}
            title="Commit TLB & Page Table updates"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm cursor-pointer"
          >
            Commit
          </button>

          <button
            onClick={handleResetAllVM}
            title="Reset VM state to initial default"
            className="p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix="virtual-memory-trace" />
        </div>
      </div>

      {/* Address Breakdown Diagram */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Virtual Address Decomposition */}
          <div className="p-3.5 rounded-xl bg-card-surface border border-border-main">
            <div className="text-xs font-bold text-accent-primary mb-2 flex items-center justify-between">
              <span>Virtual Address (16-bit)</span>
              <span className="font-mono font-bold">0x{virtualAddress.toString(16).toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/30">
                <div className="text-[10px] text-accent-primary font-bold">VPN ({simResult.vpnBits} bits)</div>
                <div className="text-lg font-black text-text-heading">{simResult.vpn}</div>
                <div className="text-[10px] text-text-muted font-medium">Page #{simResult.vpn}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30">
                <div className="text-[10px] text-accent-emerald font-bold">Offset ({simResult.offsetBits} bits)</div>
                <div className="text-lg font-black text-text-heading">0x{simResult.offset.toString(16).toUpperCase()}</div>
                <div className="text-[10px] text-text-muted font-medium">Byte {simResult.offset}</div>
              </div>
            </div>
          </div>

          {/* Physical Address Construction */}
          <div className="p-3.5 rounded-xl bg-card-surface border border-border-main">
            <div className="text-xs font-bold text-accent-amber mb-2 flex items-center justify-between">
              <span>Physical Address (14-bit)</span>
              <span className="font-mono font-bold text-accent-amber">0x{simResult.physicalAddress.toString(16).toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-accent-amber/10 border border-accent-amber/30">
                <div className="text-[10px] text-accent-amber font-bold">PFN ({simResult.pfnBits} bits)</div>
                <div className="text-lg font-black text-text-heading">
                  {simResult.physicalAddress >> simResult.offsetBits}
                </div>
                <div className="text-[10px] text-text-muted font-medium">RAM Frame #{simResult.physicalAddress >> simResult.offsetBits}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30">
                <div className="text-[10px] text-accent-emerald font-bold">Offset ({simResult.offsetBits} bits)</div>
                <div className="text-lg font-black text-text-heading">0x{simResult.offset.toString(16).toUpperCase()}</div>
                <div className="text-[10px] text-text-muted font-medium">Passed Unaltered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Memory Hierarchy Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 1. TLB Cache */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          activeStep?.activeComponent === 'TLB'
            ? 'border-accent-primary ring-2 ring-accent-primary/40 bg-accent-primary/5'
            : 'border-border-main'
        }`}>
          <div className="flex items-center justify-between mb-2 border-b border-border-main pb-2">
            <h4 className="text-xs font-bold text-accent-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              TLB Cache (Fast Lookaside)
            </h4>
            <span className="text-[10px] font-mono font-bold text-text-muted">4 Slots</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {tlbState.map((t, idx) => {
              const isMatch = t.valid && t.vpn === simResult.vpn;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isMatch
                      ? 'border-accent-emerald bg-accent-emerald/15 text-accent-emerald font-bold animate-pulse'
                      : 'bg-card-surface border-border-main text-text-body'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-text-faint">#{idx}</span>
                    <span>VPN {t.vpn}</span>
                    <ArrowRight className="w-3 h-3 text-text-faint" />
                    <span className="text-accent-amber font-bold">Frame {t.pfn}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    t.valid ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-card-bg text-text-faint'
                  }`}>
                    {t.valid ? 'V=1' : 'V=0'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Page Table */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          activeStep?.activeComponent === 'PAGE_TABLE'
            ? 'border-accent-secondary ring-2 ring-accent-secondary/40 bg-accent-secondary/5'
            : 'border-border-main'
        }`}>
          <div className="flex items-center justify-between mb-2 border-b border-border-main pb-2">
            <h4 className="text-xs font-bold text-accent-secondary flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Page Table (RAM Resident)
            </h4>
            <span className="text-[10px] font-mono font-bold text-text-muted">16 Virtual Pages</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-1">
            {pageTableState.map((pte) => {
              const isTargetVPN = pte.vpn === simResult.vpn;
              return (
                <div
                  key={pte.vpn}
                  className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                    isTargetVPN
                      ? pte.valid
                        ? 'border-accent-emerald bg-accent-emerald/15 text-accent-emerald font-bold'
                        : 'border-accent-rose bg-accent-rose/15 text-accent-rose font-bold'
                      : 'bg-card-surface border-border-main text-text-muted'
                  }`}
                >
                  <span>Page #{pte.vpn}</span>
                  <span>{pte.valid ? `Frame #${pte.pfn}` : `Disk #${pte.diskSector}`}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    pte.valid ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-accent-rose/20 text-accent-rose'
                  }`}>
                    {pte.valid ? 'Valid (RAM)' : 'Fault (Disk)'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Physical RAM & Disk */}
        <div className={`bg-card-bg border rounded-2xl p-4 transition-all shadow-sm ${
          activeStep?.activeComponent === 'RAM' || activeStep?.activeComponent === 'DISK'
            ? 'border-accent-amber ring-2 ring-accent-amber/40 bg-accent-amber/5'
            : 'border-border-main'
        }`}>
          <div className="flex items-center justify-between mb-2 border-b border-border-main pb-2">
            <h4 className="text-xs font-bold text-accent-amber flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Physical RAM Frames (16 KB)
            </h4>
            <span className="text-[10px] font-mono font-bold text-text-muted">4 Frames × 4KB</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {ramFramesState.map((f) => {
              const isAllocated = f.vpnLoaded !== null;
              const isHitFrame = isAllocated && f.vpnLoaded === simResult.vpn;

              return (
                <div
                  key={f.frameNumber}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isHitFrame
                      ? 'border-accent-emerald bg-accent-emerald/15 text-accent-emerald font-bold'
                      : 'bg-card-surface border-border-main text-text-body'
                  }`}
                >
                  <span className="font-bold text-accent-amber">Frame #{f.frameNumber}</span>
                  <span className="text-text-muted font-medium">
                    {isAllocated ? `Holds Page #${f.vpnLoaded}` : 'Free Frame'}
                  </span>
                  <span className="text-[10px] bg-card-surface text-text-muted px-1.5 py-0.5 rounded font-bold border border-border-main">
                    4 KB
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Explanation Card */}
      <ExplanationCard
        title={activeStep?.title || 'Virtual Memory Step'}
        badge={
          simResult.isTLBHit ? 'TLB HIT (1 Cycle)' :
          simResult.isPageFault ? 'PAGE FAULT (Disk Trap)' :
          'PAGE TABLE HIT (Soft Miss)'
        }
        badgeColor={
          simResult.isTLBHit ? 'emerald' :
          simResult.isPageFault ? 'rose' : 'amber'
        }
        actionTaken={activeStep?.description}
        explanation={activeStep?.explanation || ''}
        formula={`Physical Address = (PFN << 12) | Offset = (0x${(simResult.physicalAddress >> 12).toString(16).toUpperCase()} << 12) | 0x${simResult.offset.toString(16).toUpperCase()} = 0x${simResult.physicalAddress.toString(16).toUpperCase()}`}
        subNotes={[
          'TLB Hit: MMU fast-path resolves virtual page in 1 clock cycle directly on-chip.',
          'Page Table Hit: Page is in main RAM, but wasn’t in TLB (incurs 1 memory read penalty).',
          'Page Fault: Page Valid bit = 0. Hardware triggers OS page fault interrupt handler to load 4KB page from disk into RAM.',
        ]}
      />

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
        statusText={`Virtual Memory Translation: ${activeStep?.title || ''}`}
      />
    </div>
  );
};
