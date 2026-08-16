import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  simulatePipeline, 
  PRESET_PROGRAMS, 
  Instruction, 
  PipelineConfig, 
  PipelineSimulationResult 
} from '../../../engines/cpu/pipeline.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { XRayModal, XRayComponentType } from '../../schematic/XRayModal.tsx';
import { PipelineComparator } from '../../comparative/PipelineComparator.tsx';
import { ClockWaveformTimeline } from '../../schematic/ClockWaveformTimeline.tsx';
import { PipelineDiagram } from './PipelineDiagram.tsx';
import { 
  Sparkles, 
  Zap, 
  Layers,
  Repeat,
  ZoomIn,
  SplitSquareVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const PipelineSimulator: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = usePersistentState<number>('pipe_preset', 0);
  const [enableForwarding, setEnableForwarding] = usePersistentState<boolean>('pipe_fwd', true);
  
  const [instructions, setInstructions] = useState<Instruction[]>(
    PRESET_PROGRAMS[selectedPresetIndex]?.instructions || PRESET_PROGRAMS[0].instructions
  );
  const [branchOutcomeTaken, setBranchOutcomeTaken] = useState<boolean>(
    PRESET_PROGRAMS[selectedPresetIndex]?.branchTaken ?? false
  );

  const [currentCycleIndex, setCurrentCycleIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // X-Ray inspector state
  const [xrayType, setXrayType] = useState<XRayComponentType | null>(null);

  // Compute simulation
  const config: PipelineConfig = useMemo(() => ({
    enableForwarding,
    branchPrediction: 'NOT_TAKEN',
    branchOutcomeTaken,
  }), [enableForwarding, branchOutcomeTaken]);

  const simResult: PipelineSimulationResult = useMemo(() => {
    return simulatePipeline(instructions, config);
  }, [instructions, config]);

  const totalCycles = simResult.totalCycles;
  const activeCycle = simResult.cycleStates[currentCycleIndex] || simResult.cycleStates[0];

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    const activePresetName = PRESET_PROGRAMS[selectedPresetIndex]?.name || 'Custom Program';
    const cols = [
      { key: 'cycle', header: 'Cycle' },
      { key: 'IF', header: 'IF (Fetch)' },
      { key: 'ID', header: 'ID (Decode)' },
      { key: 'EX', header: 'EX (Execute)' },
      { key: 'MEM', header: 'MEM (Memory)' },
      { key: 'WB', header: 'WB (Writeback)' },
      { key: 'hazards', header: 'Hazards & Forwarding' },
    ];

    const rows = simResult.cycleStates.map((cs) => ({
      cycle: `C${cs.cycle}`,
      IF: cs.IF ? `I${cs.IF.id} (${cs.IF.opcode})` : '-',
      ID: cs.ID ? `I${cs.ID.id} (${cs.ID.opcode})` : '-',
      EX: cs.EX ? `I${cs.EX.id} (${cs.EX.opcode})` : '-',
      MEM: cs.MEM ? `I${cs.MEM.id} (${cs.MEM.opcode})` : '-',
      WB: cs.WB ? `I${cs.WB.id} (${cs.WB.opcode})` : '-',
      hazards: [
        ...(cs.hazards || []),
        ...(cs.forwardingEvents || []),
      ].join('; ') || 'Normal',
    }));

    return {
      title: `5-Stage CPU Pipeline Space-Time Trace (${activePresetName})`,
      subtitle: `Forwarding: ${enableForwarding ? 'ENABLED' : 'DISABLED'} | Total Instructions: ${instructions.length}`,
      parameters: {
        'Program': activePresetName,
        'Forwarding': enableForwarding ? 'ENABLED (Bypass)' : 'DISABLED (Stalls)',
        'Total Cycles': totalCycles,
        'Instruction Count': instructions.length,
        'CPI': simResult.cpi,
        'Speedup': `${simResult.speedup}x`,
      },
      columns: cols,
      rows: rows,
      conclusion: `Execution completed in ${totalCycles} cycles with CPI = ${simResult.cpi} and Speedup = ${simResult.speedup}x`,
    };
  }, [selectedPresetIndex, enableForwarding, instructions, simResult, totalCycles]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return simResult.cycleStates.map((cs, idx) => ({
      stepIndex: idx,
      label: `C${cs.cycle}`,
      category: cs.hazards?.length ? 'compute' : 'default',
    }));
  }, [simResult]);

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      const intervalMs = Math.max(300, 1500 / speed);
      timer = setInterval(() => {
        setCurrentCycleIndex((prev) => {
          if (prev >= totalCycles - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, totalCycles]);

  // Confetti on final cycle
  useEffect(() => {
    if (currentCycleIndex === totalCycles - 1 && totalCycles > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  }, [currentCycleIndex, totalCycles]);

  const handleStepForward = useCallback(() => {
    setCurrentCycleIndex((prev) => Math.min(totalCycles - 1, prev + 1));
  }, [totalCycles]);

  const handleStepBackward = useCallback(() => {
    setCurrentCycleIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentCycleIndex(0);
  }, []);

  const handleSeek = useCallback((stepIdx: number) => {
    setIsPlaying(false);
    setCurrentCycleIndex(Math.max(0, Math.min(totalCycles - 1, stepIdx)));
  }, [totalCycles]);

  const handlePresetChange = (idx: number) => {
    setSelectedPresetIndex(idx);
    const preset = PRESET_PROGRAMS[idx];
    setInstructions(preset.instructions);
    setBranchOutcomeTaken(preset.branchTaken ?? false);
    setCurrentCycleIndex(0);
    setIsPlaying(false);
  };

  const [isComparativeView, setIsComparativeView] = useState<boolean>(false);

  const stageColor = (stage: string | undefined) => {
    switch (stage) {
      case 'IF': return 'bg-accent-primary/15 text-accent-primary border-accent-primary/40';
      case 'ID': return 'bg-accent-secondary/15 text-accent-secondary border-accent-secondary/40';
      case 'EX': return 'bg-accent-amber/15 text-accent-amber border-accent-amber/40';
      case 'MEM': return 'bg-accent-emerald/15 text-accent-emerald border-accent-emerald/40';
      case 'WB': return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40';
      case 'STALL': return 'bg-accent-rose/20 text-accent-rose border-accent-rose/60 font-black animate-pulse';
      case 'FLUSH': return 'bg-card-surface text-text-faint border-border-main line-through';
      default: return 'bg-card-surface text-text-faint border-border-main';
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* X-Ray Cutaway Modal */}
      {xrayType && (
        <XRayModal
          isOpen={!!xrayType}
          onClose={() => setXrayType(null)}
          componentType={xrayType}
          activeData={{
            forwardingSource: activeCycle?.forwardingEvents?.join(', ') || 'Direct Register Read',
            operation: activeCycle?.EX?.opcode || 'ADD',
          }}
        />
      )}

      {/* Top Configuration & Presets */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Presets:
          </span>
          {PRESET_PROGRAMS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetChange(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                selectedPresetIndex === idx
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'bg-card-surface border-border-main text-text-body hover:border-accent-primary hover:bg-card-subtle'
              }`}
            >
              {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Pipeline Control Toggles & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          <button
            onClick={() => setXrayType('PIPELINE_LATCH')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/30 transition-all shadow-sm active:scale-95"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>IF/ID Latch X-Ray</span>
          </button>

          {/* Forwarding Toggle Button */}
          <button
            onClick={() => {
              setEnableForwarding(!enableForwarding);
              setCurrentCycleIndex(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              enableForwarding
                ? 'bg-accent-emerald text-white shadow-sm'
                : 'bg-accent-rose/15 text-accent-rose border border-accent-rose/40 hover:bg-accent-rose/25'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Forwarding: {enableForwarding ? 'ON' : 'OFF'}</span>
          </button>

          {/* Branch Taken Toggle (for BEQ) */}
          {instructions.some((i) => i.opcode === 'BEQ') && (
            <button
              onClick={() => {
                setBranchOutcomeTaken(!branchOutcomeTaken);
                setCurrentCycleIndex(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                branchOutcomeTaken
                  ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/40'
                  : 'bg-card-surface border-border-main text-text-muted'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Branch BEQ: {branchOutcomeTaken ? 'TAKEN (Flush)' : 'NOT TAKEN'}</span>
            </button>
          )}

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix="pipeline-trace" />
        </div>
      </div>

      {/* Side-by-Side Comparative View Component */}
      {isComparativeView && (
        <PipelineComparator instructions={instructions} />
      )}

      {/* Real-time Timing & Waveform Analyzer */}
      <ClockWaveformTimeline
        currentStep={currentCycleIndex}
        totalSteps={totalCycles}
        timingSignal={`Cycle ${activeCycle?.cycle || 1}`}
        phaseLabel={activeCycle?.hazards?.length ? 'HAZARD STALL' : 'ACTIVE PIPELINE'}
        activeSignals={{
          clk: isPlaying || true,
          read: !!activeCycle?.MEM,
          write: !!activeCycle?.WB,
          load: true,
        }}
        onStepSelect={(c) => {
          setIsPlaying(false);
          setCurrentCycleIndex(c);
        }}
      />

      {/* 5-Stage Animated SVG Pipeline Diagram */}
      <PipelineDiagram
        cycleState={activeCycle}
        cycleIndex={currentCycleIndex}
        simResult={simResult}
        onClickStage={(stage) => {
          if (stage === 'IF') setXrayType('PIPELINE_LATCH');
          else if (stage === 'ID') setXrayType('REGISTER_FILE');
          else if (stage === 'EX') setXrayType('ALU');
          else if (stage === 'MEM') setXrayType('SRAM_CELL');
          else if (stage === 'WB') setXrayType('REGISTER_FILE');
        }}
      />

      {/* Live Explanation Card */}
      <ExplanationCard
        title={`Clock Cycle ${activeCycle?.cycle || 1} Breakdown`}
        badge={`Cycle ${activeCycle?.cycle || 1} / ${totalCycles}`}
        badgeColor={
          activeCycle?.hazards && activeCycle.hazards.length > 0 ? 'rose' :
          activeCycle?.forwardingEvents && activeCycle.forwardingEvents.length > 0 ? 'emerald' : 'cyan'
        }
        actionTaken={activeCycle?.actionTaken}
        explanation={activeCycle?.explanation || ''}
        formula={`CPI = Total Cycles (${totalCycles}) / Instructions (${instructions.length}) = ${simResult.cpi} (Speedup: ${simResult.speedup}x over Unpipelined)`}
        subNotes={[
          '5 Stages: IF (Instruction Fetch) ➔ ID (Decode/Reg Read) ➔ EX (Execute) ➔ MEM (Memory) ➔ WB (Write Back).',
          enableForwarding
            ? 'Forwarding Unit feeds ALU results directly from EX/MEM or MEM/WB pipeline registers without waiting for WB.'
            : 'Without forwarding, RAW hazards require 2-3 bubble stall cycles until WB writes to the register file.',
        ]}
      />

      {/* Space-Time Reservation Chart */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-border-main pb-2.5">
          <h3 className="font-extrabold text-sm text-text-heading flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-primary" />
            Space-Time Reservation Matrix (Clock Cycles × Instructions)
          </h3>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-accent-primary font-bold">CPI: {simResult.cpi}</span>
            <span className="text-accent-emerald font-bold">Speedup: {simResult.speedup}x</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-main">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-card-surface text-text-muted uppercase tracking-wider border-b border-border-main font-bold">
              <tr>
                <th className="p-2.5 min-w-[140px] sticky left-0 bg-card-surface z-10">Instruction</th>
                {Array.from({ length: totalCycles }, (_, i) => (
                  <th
                    key={i}
                    onClick={() => handleSeek(i)}
                    className={`p-2.5 text-center cursor-pointer min-w-[48px] transition-colors ${
                      i === currentCycleIndex
                        ? 'bg-accent-primary/20 text-accent-primary font-black border-b-2 border-accent-primary'
                        : 'hover:bg-card-subtle text-text-muted'
                    }`}
                  >
                    C{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {simResult.reservationTable.map((row) => (
                <tr key={row.instruction.id} className="hover:bg-card-surface/60 transition-colors">
                  <td className="p-2.5 font-bold text-text-heading sticky left-0 bg-card-bg z-10 truncate border-r border-border-main">
                    <span className="text-accent-primary mr-1.5">I{row.instruction.id}:</span>
                    {row.instruction.rawText}
                  </td>
                  {Array.from({ length: totalCycles }, (_, cycleIdx) => {
                    const slot = row.slots[cycleIdx];
                    const isCurrent = cycleIdx === currentCycleIndex;
                    return (
                      <td
                        key={cycleIdx}
                        onClick={() => handleSeek(cycleIdx)}
                        className={`p-1.5 text-center cursor-pointer ${
                          isCurrent ? 'bg-accent-primary/10' : ''
                        }`}
                      >
                        {slot ? (
                          <div
                            className={`px-1.5 py-1 rounded text-[11px] font-black border ${stageColor(
                              slot.stage
                            )} ${isCurrent ? 'scale-105 shadow-sm' : ''}`}
                          >
                            {slot.stage}
                          </div>
                        ) : (
                          <span className="text-text-faint font-mono text-[10px]">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Presentation Controller Bar */}
      <ControllerBar
        currentStep={currentCycleIndex}
        totalSteps={totalCycles}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        onJumpToStart={handleReset}
        onJumpToEnd={() => handleSeek(totalCycles - 1)}
        onSeekStep={handleSeek}
        phases={timelinePhases}
        speed={speed}
        onChangeSpeed={setSpeed}
        statusText={`5-Stage Pipeline: Clock Cycle ${activeCycle?.cycle || 1} of ${totalCycles}`}
      />
    </div>
  );
};
