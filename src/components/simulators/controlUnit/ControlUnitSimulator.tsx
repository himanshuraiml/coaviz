import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  simulateHardwiredCU, 
  simulateMicroprogrammedCU, 
  ControlUnitType, 
  InstructionOpcode, 
  HardwiredStep,
  MicroprogrammedStep
} from '../../../engines/cpu/controlUnit.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { 
  Layers, 
  Zap, 
  HardDrive
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ControlUnitSimulator: React.FC = () => {
  const [cuMode, setCuMode] = useState<ControlUnitType>('HARDWIRED');
  const [opcode, setOpcode] = useState<InstructionOpcode>('ADD');
  const [isIndirect, setIsIndirect] = useState<boolean>(false);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Compute Simulation Result
  const simResult = useMemo(() => {
    return cuMode === 'HARDWIRED'
      ? simulateHardwiredCU(opcode, isIndirect)
      : simulateMicroprogrammedCU(opcode, isIndirect);
  }, [cuMode, opcode, isIndirect]);

  const steps = simResult.steps;
  const totalSteps = steps.length;
  const activeStep = steps[currentStepIndex] || steps[0];

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

  // Confetti on last step
  useEffect(() => {
    if (currentStepIndex === totalSteps - 1 && totalSteps > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  }, [currentStepIndex, totalSteps]);

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

  const opcodesList: InstructionOpcode[] = ['ADD', 'LDA', 'STA', 'BUN'];

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto">
      {/* Architecture Toggle & Opcode Selector */}
      <div className="panel-card p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* CU Architecture Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => {
              setCuMode('HARDWIRED');
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              cuMode === 'HARDWIRED'
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm font-black'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hardwired CU (Gate Matrix)</span>
          </button>

          <button
            onClick={() => {
              setCuMode('MICROPROGRAMMED');
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              cuMode === 'MICROPROGRAMMED'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm font-black'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Microprogrammed CU (Control ROM)</span>
          </button>
        </div>

        {/* Opcode & Addressing Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Instruction:</span>
            {opcodesList.map((op) => (
              <button
                key={op}
                onClick={() => {
                  setOpcode(op);
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                  opcode === op
                    ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm font-black'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-xs'
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setIsIndirect(!isIndirect);
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isIndirect
                ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 dark:border-amber-600 shadow-sm font-black'
                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs'
            }`}
          >
            Addressing: {isIndirect ? 'Indirect (I = 1)' : 'Direct (I = 0)'}
          </button>
        </div>
      </div>

      {/* Main Architecture Visualizer */}
      {cuMode === 'HARDWIRED' ? (
        /* Hardwired CU Visual Flow */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Timing Step Counter */}
          <div className="panel-card p-4">
            <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1 flex items-center justify-between">
              <span>Sequence Counter (SC)</span>
              <span className="text-[10px] bg-cyan-500/15 px-1.5 py-0.5 rounded font-mono font-bold">4x16 Decoder</span>
            </div>
            <div className="text-2xl font-black text-cyan-800 dark:text-cyan-200 font-mono my-2 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300">
                {(activeStep as HardwiredStep).timingSignal}
              </span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Timing Line Active</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Clock pulse generator & SC increment</div>
          </div>

          {/* Opcode Decoder */}
          <div className="panel-card p-4">
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center justify-between">
              <span>Opcode 3x8 Decoder</span>
              <span className="text-[10px] bg-indigo-500/15 px-1.5 py-0.5 rounded font-mono font-bold">IR(14-12)</span>
            </div>
            <div className="text-2xl font-black text-indigo-800 dark:text-indigo-200 font-mono my-2 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300">
                D_{opcode}
              </span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Line Active</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Decodes 3-bit Opcode to 1-of-8 lines</div>
          </div>

          {/* Active Control Logic Gates */}
          <div className="panel-card p-4 md:col-span-2">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center justify-between">
              <span>Control Logic Matrix (AND / OR Gates)</span>
              <span className="text-[10px] bg-amber-500/15 px-1.5 py-0.5 rounded font-mono font-bold">Matrix</span>
            </div>
            <div className="flex flex-wrap gap-1.5 my-2 min-h-[2.5rem] items-center">
              {(activeStep as HardwiredStep).activeGates.map((gate, i) => (
                <span key={i} className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-mono font-black animate-pulse">
                  {gate}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Hardware combinational circuit producing direct control lines</div>
          </div>
        </div>
      ) : (
        /* Microprogrammed CU Visual Flow */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* CAR Register */}
          <div className="panel-card p-4">
            <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1 flex items-center justify-between">
              <span>Control Address Reg (CAR)</span>
              <span className="text-[10px] bg-cyan-500/15 px-1.5 py-0.5 rounded font-mono font-bold">CAR Address</span>
            </div>
            <div className="text-2xl font-black text-cyan-800 dark:text-cyan-200 font-mono my-2 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300">
                #{(activeStep as MicroprogrammedStep).car}
              </span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {(activeStep as MicroprogrammedStep).cdr.label}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Points to current micro-instruction in ROM</div>
          </div>

          {/* CDR / MIR Register */}
          <div className="panel-card p-4 md:col-span-2">
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center justify-between">
              <span>Control Data Register (CDR / MIR)</span>
              <span className="text-[10px] bg-indigo-500/15 px-1.5 py-0.5 rounded font-mono font-bold">Micro-word</span>
            </div>
            <div className="font-mono text-xs text-indigo-800 dark:text-indigo-200 my-2 p-2.5 rounded-xl sub-panel border">
              <div className="font-bold text-cyan-700 dark:text-cyan-300 text-sm mb-1">
                {(activeStep as MicroprogrammedStep).cdr.microOperation}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Pattern: <span className="text-indigo-700 dark:text-indigo-300 font-bold">{(activeStep as MicroprogrammedStep).cdr.rawControlWord}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Holds micro-instruction fields: [F1 | F2 | CD | BR | AD]</div>
          </div>

          {/* Next Address / Sequencer */}
          <div className="panel-card p-4">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between">
              <span>Sequencer & Branching</span>
              <span className="text-[10px] bg-emerald-500/15 px-1.5 py-0.5 rounded font-mono font-bold">Next CAR</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono my-2 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40">
                #{(activeStep as MicroprogrammedStep).nextCar}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {(activeStep as MicroprogrammedStep).branchConditionStatus}
            </div>
          </div>
        </div>
      )}

      {/* Live Explanation Card */}
      <ExplanationCard
        title={activeStep?.description || 'Control Unit Step'}
        badge={cuMode === 'HARDWIRED' ? (activeStep as HardwiredStep).timingSignal : `CAR = ${(activeStep as MicroprogrammedStep).car}`}
        badgeColor={cuMode === 'HARDWIRED' ? 'cyan' : 'indigo'}
        actionTaken={
          cuMode === 'HARDWIRED'
            ? `Register Transfers: ${(activeStep as HardwiredStep).registerTransfers.join(', ')}`
            : `Micro-Op: ${(activeStep as MicroprogrammedStep).cdr.microOperation} ➔ Next CAR: ${(activeStep as MicroprogrammedStep).nextCar}`
        }
        explanation={activeStep?.explanation || ''}
        formula={
          cuMode === 'HARDWIRED'
            ? `Control Function: ${opcode} · ${isIndirect ? "I'" : 'I'} · ${(activeStep as HardwiredStep).timingSignal}`
            : `Micro-ROM Word: [F1: ${(activeStep as MicroprogrammedStep).cdr.f1_alu}, F2: ${(activeStep as MicroprogrammedStep).cdr.f2_bus}, CD: ${(activeStep as MicroprogrammedStep).cdr.cd_condition}, BR: ${(activeStep as MicroprogrammedStep).cdr.br_branch}, AD: ${(activeStep as MicroprogrammedStep).cdr.nextAddress}]`
        }
        subNotes={[
          'Hardwired CU: Extremely fast, fixed gate logic (AND/OR matrix), non-modifiable without rewiring silicon.',
          'Microprogrammed CU: Flexible micro-programs stored in Control ROM, easy instruction set upgrades via firmware.',
        ]}
      />

      {/* Step Breakdown Table */}
      <div className="panel-card p-4 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            {cuMode === 'HARDWIRED' ? "Hardwired Sequence Timing Table" : "Micro-Programmed ROM Execution Sequence"}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">{totalSteps} micro-steps</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sub-panel text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="p-2.5 text-center">#</th>
                <th className="p-2.5">{cuMode === 'HARDWIRED' ? 'Timing Signal' : 'CAR Address'}</th>
                <th className="p-2.5">{cuMode === 'HARDWIRED' ? 'Register Transfers' : 'Micro-Operation'}</th>
                <th className="p-2.5">{cuMode === 'HARDWIRED' ? 'Active Control Lines' : 'Branch / Next CAR'}</th>
                <th className="p-2.5">Step Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {steps.map((st, idx) => {
                const isActive = idx === currentStepIndex;
                const isHard = cuMode === 'HARDWIRED';
                const hStep = st as HardwiredStep;
                const mStep = st as MicroprogrammedStep;

                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIndex(idx);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isActive
                        ? isHard
                          ? 'bg-cyan-500/15 text-slate-950 dark:text-white font-bold border-l-4 border-cyan-500'
                          : 'bg-indigo-500/15 text-slate-950 dark:text-white font-bold border-l-4 border-indigo-500'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">
                      {isHard ? hStep.timingSignal : `#${mStep.car} (${mStep.cdr.label || ''})`}
                    </td>
                    <td className="p-2.5 font-bold text-amber-700 dark:text-amber-300">
                      {isHard ? hStep.registerTransfers.join('; ') : mStep.cdr.microOperation}
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">
                      {isHard ? hStep.activeControlSignals.join(', ') : `Next ➔ #${mStep.nextCar} (${mStep.branchConditionStatus})`}
                    </td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300 truncate max-w-xs">{st.description}</td>
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
        onJumpToStart={() => {
          setIsPlaying(false);
          setCurrentStepIndex(0);
        }}
        onJumpToEnd={() => {
          setIsPlaying(false);
          setCurrentStepIndex(totalSteps - 1);
        }}
        speed={speed}
        onChangeSpeed={setSpeed}
        statusText={`${cuMode}: ${opcode} Instruction (Step ${currentStepIndex + 1} of ${totalSteps})`}
      />
    </div>
  );
};
