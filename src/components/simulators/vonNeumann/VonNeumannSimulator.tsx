import React, { useState, useEffect, useMemo } from 'react';
import { 
  simulateVonNeumann, 
  VonNeumannResult 
} from '../../../engines/cpu/vonNeumann.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { XRayModal, XRayComponentType } from '../../schematic/XRayModal.tsx';
import { ClockWaveformTimeline } from '../../schematic/ClockWaveformTimeline.tsx';
import { VonNeumannDiagram } from './VonNeumannDiagram.tsx';
import { AlertTriangle, ZoomIn, Layers, Cpu } from 'lucide-react';

export const VonNeumannSimulator: React.FC = () => {
  const [valA, setValA] = useState<number>(18);
  const [valB, setValB] = useState<number>(24);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  const [xrayType, setXrayType] = useState<XRayComponentType | null>(null);

  const simulationResult: VonNeumannResult = useMemo(() => {
    return simulateVonNeumann({
      programName: 'ADD_TWO_NUMBERS',
      customA: valA,
      customB: valB,
    });
  }, [valA, valB]);

  const totalSteps = simulationResult.steps.length;
  const currentStep = simulationResult.steps[currentStepIndex] || simulationResult.steps[0];

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [valA, valB]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      const intervalMs = Math.max(250, 1200 / speed);
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isPlaying, speed, totalSteps]);

  const handleStepForward  = () => { if (currentStepIndex < totalSteps - 1) setCurrentStepIndex(p => p + 1); };
  const handleStepBackward = () => { if (currentStepIndex > 0) setCurrentStepIndex(p => p - 1); };
  const handleReset        = () => { setIsPlaying(false); setCurrentStepIndex(0); };

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-7xl mx-auto w-full">
      {/* X-Ray Inspector Modal */}
      {xrayType && (
        <XRayModal
          isOpen={!!xrayType}
          onClose={() => setXrayType(null)}
          componentType={xrayType}
          activeData={{
            operandA: currentStep.registers.ac,
            operandB: currentStep.registers.mdr,
            result: currentStep.registers.ac,
            operation: currentStep.registers.ir.opcode,
            flags: {
              Z: currentStep.registers.ac === 0,
              S: currentStep.registers.ac < 0,
              C: false,
              V: false,
            },
          }}
        />
      )}

      {/* Top Configuration & State Bar */}
      <div className="panel-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Von Neumann Architecture</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline font-medium">
            Stored-Program Concept (Unified Memory + Shared System Bus)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 sub-panel px-3 py-1.5 border">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Var A:</span>
            <input
              type="number" min={1} max={99} value={valA}
              onChange={(e) => setValA(Number(e.target.value) || 1)}
              className="w-16 input-box text-center text-xs py-1 px-2 text-cyan-700 dark:text-cyan-300"
            />
          </div>
          <div className="flex items-center gap-2 sub-panel px-3 py-1.5 border">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Var B:</span>
            <input
              type="number" min={1} max={99} value={valB}
              onChange={(e) => setValB(Number(e.target.value) || 1)}
              className="w-16 input-box text-center text-xs py-1 px-2 text-indigo-700 dark:text-indigo-300"
            />
          </div>
        </div>
      </div>

      {/* Clock Waveform Timeline */}
      <ClockWaveformTimeline
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        timingSignal={`T${currentStepIndex}`}
        phaseLabel={currentStep.phase}
        activeSignals={{
          clk: isPlaying || true,
          read: currentStep.activeBus === 'DATA_BUS' && currentStep.phase !== 'EXECUTE',
          write: currentStep.activeBus === 'DATA_BUS' && currentStep.phase === 'EXECUTE',
          load: !!currentStep.activeComponent,
        }}
        onStepSelect={(s) => { setIsPlaying(false); setCurrentStepIndex(s); }}
      />

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Hardware Schematic Diagram (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <VonNeumannDiagram
            step={currentStep}
            stepIndex={currentStepIndex}
            onClickBlock={(block) => setXrayType(block as XRayComponentType)}
          />

          {/* X-Ray shortcut buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Gate X-Ray:</span>
            <button onClick={() => setXrayType('ALU')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 transition-all active:scale-95">
              <ZoomIn className="w-3.5 h-3.5" /><span>ALU Cross-Section</span>
            </button>
            <button onClick={() => setXrayType('REGISTER_FILE')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-all active:scale-95">
              <Layers className="w-3.5 h-3.5" /><span>MAR/MDR Latch</span>
            </button>
            <button onClick={() => setXrayType('SRAM_CELL')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 transition-all active:scale-95">
              <Cpu className="w-3.5 h-3.5" /><span>SRAM Bitcell</span>
            </button>
          </div>
        </div>

        {/* Right: High Readability Explanation & Register Bank State (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <ExplanationCard
            title={currentStep.title}
            badge={`PHASE: ${currentStep.phase}`}
            badgeColor={
              currentStep.bottleneckActive ? 'amber' :
              currentStep.phase === 'EXECUTE' ? 'emerald' : 'cyan'
            }
            actionTaken={currentStep.description}
            explanation={currentStep.explanation}
            formula={`PC=0x0${currentStep.registers.pc} | MAR=0x${currentStep.registers.mar.toString(16).toUpperCase()} | MDR=0x${currentStep.registers.mdr.toString(16).toUpperCase()} | AC=${currentStep.registers.ac}`}
            subNotes={[
              'Stored-Program Concept: Instructions and Data share the unified memory space.',
              'Sequential Execution: CPU fetches instructions sequentially unless altered by jump/branch.',
              currentStep.bottleneckActive
                ? `⚠️ Von Neumann Bottleneck: ${currentStep.bottleneckExplanation}`
                : 'Shared Memory Bus: Transports opcodes and operands over the same physical bus.'
            ]}
          />

          {/* High-Contrast Register Inspection Bank */}
          <div className="panel-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                CPU Register Bank State
              </h4>
              <span className="text-[10px] font-mono text-slate-500 font-bold">RADIX: HEXADECIMAL</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="sub-panel p-2.5 border border-amber-500/40 bg-amber-500/5">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold">PC</div>
                <div className="text-sm font-black text-amber-700 dark:text-amber-300">0x0{currentStep.registers.pc}</div>
              </div>
              <div className="sub-panel p-2.5 border border-cyan-500/40 bg-cyan-500/5">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold">MAR</div>
                <div className="text-sm font-black text-cyan-700 dark:text-cyan-300">0x{currentStep.registers.mar.toString(16).toUpperCase()}</div>
              </div>
              <div className="sub-panel p-2.5 border">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold">MDR/MBR</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">0x{currentStep.registers.mdr.toString(16).toUpperCase()}</div>
              </div>
              <div className="sub-panel p-2.5 border">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold">AC</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentStep.registers.ac}</div>
              </div>
              <div className="sub-panel p-2.5 border">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold">IR</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{currentStep.registers.ir.raw}</div>
              </div>
              <div className="sub-panel p-2.5 border">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold">FLAGS</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Z={currentStep.registers.ac === 0 ? 1 : 0} S={currentStep.registers.ac < 0 ? 1 : 0}
                </div>
              </div>
            </div>
          </div>

          {/* Bottleneck Meter */}
          <div className="panel-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <AlertTriangle className={`w-4 h-4 ${currentStep.bottleneckActive ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Von Neumann Bottleneck Meter
              </h3>
            </div>
            <div className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 transition-all ${
              currentStep.bottleneckActive
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-md'
                : 'sub-panel border text-slate-600 dark:text-slate-400'
            }`}>
              <span className="font-bold flex items-center justify-between">
                <span>Bus Contention:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                  currentStep.bottleneckActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {currentStep.bottleneckActive ? 'BOTTLENECK ACTIVE' : 'NORMAL'}
                </span>
              </span>
              <p className="text-[11px] leading-relaxed">
                {currentStep.bottleneckActive
                  ? 'CPU execution speed restricted: instruction fetch and data operand access share the single memory bus sequentially.'
                  : 'Modern CPUs use Split L1 Caches (Harvard architecture) to eliminate this shared memory bus bottleneck.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Controller Bar */}
      <ControllerBar
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        onJumpToStart={() => { setIsPlaying(false); setCurrentStepIndex(0); }}
        onJumpToEnd={() => { setIsPlaying(false); setCurrentStepIndex(totalSteps - 1); }}
        speed={speed}
        onChangeSpeed={setSpeed}
        statusText={`Von Neumann Cycle: ${currentStep.title}`}
      />
    </div>
  );
};
