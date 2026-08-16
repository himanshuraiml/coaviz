import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  AddressingModeType, 
  AddressingModeResult, 
  evaluateAddressingMode 
} from '../../../engines/cpu/addressingModes.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { Database, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AddressingSimulator: React.FC = () => {
  const [mode, setMode] = useState<AddressingModeType>('DIRECT');
  const [addressField, setAddressField] = useState<number>(300);
  const [pc, setPc] = useState<number>(100);
  const [ix, setIx] = useState<number>(50);
  const [r1, setR1] = useState<number>(400);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  const result: AddressingModeResult = useMemo(() => {
    return evaluateAddressingMode(mode, addressField, pc, ix, r1);
  }, [mode, addressField, pc, ix, r1]);

  const steps = result.steps;
  const totalSteps = steps.length;
  const activeStep = steps[currentStep] || steps[0];

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      const intervalMs = Math.max(400, 1600 / speed);
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

  // Confetti on final operand resolution
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
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const handleStepBackward = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  const handleJumpToStart = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  const handleJumpToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(totalSteps - 1);
  }, [totalSteps]);

  const modesList: { id: AddressingModeType; label: string; desc: string }[] = [
    { id: 'IMMEDIATE', label: 'Immediate', desc: 'Operand is in instruction' },
    { id: 'DIRECT', label: 'Direct', desc: 'Address specifies EA' },
    { id: 'INDIRECT', label: 'Indirect', desc: 'Address points to EA' },
    { id: 'REGISTER', label: 'Register', desc: 'Operand is in CPU register' },
    { id: 'REGISTER_INDIRECT', label: 'Register Indirect', desc: 'Register holds EA' },
    { id: 'INDEXED', label: 'Indexed', desc: 'EA = Address + IX' },
    { id: 'RELATIVE', label: 'Relative (PC)', desc: 'EA = Address + PC' },
  ];

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto">
      {/* Addressing Mode Selectors */}
      <div className="panel-card p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Mode Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {modesList.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === m.id
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20 scale-[1.02]'
                  : 'sub-panel border text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Register Values Configuration */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 sub-panel px-2.5 py-1 border text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold">Address:</span>
            <input
              type="number"
              value={addressField}
              onChange={(e) => {
                setAddressField(parseInt(e.target.value) || 0);
                setCurrentStep(0);
              }}
              className="w-14 input-box px-1.5 py-0.5 text-cyan-700 dark:text-cyan-300 text-center font-bold"
            />
          </div>

          <div className="flex items-center gap-1.5 sub-panel px-2.5 py-1 border text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold">PC:</span>
            <input
              type="number"
              value={pc}
              onChange={(e) => {
                setPc(parseInt(e.target.value) || 0);
                setCurrentStep(0);
              }}
              className="w-14 input-box px-1.5 py-0.5 text-amber-700 dark:text-amber-300 text-center font-bold"
            />
          </div>

          <div className="flex items-center gap-1.5 sub-panel px-2.5 py-1 border text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold">IX:</span>
            <input
              type="number"
              value={ix}
              onChange={(e) => {
                setIx(parseInt(e.target.value) || 0);
                setCurrentStep(0);
              }}
              className="w-14 input-box px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300 text-center font-bold"
            />
          </div>

          <div className="flex items-center gap-1.5 sub-panel px-2.5 py-1 border text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold">R1:</span>
            <input
              type="number"
              value={r1}
              onChange={(e) => {
                setR1(parseInt(e.target.value) || 0);
                setCurrentStep(0);
              }}
              className="w-14 input-box px-1.5 py-0.5 text-indigo-700 dark:text-indigo-300 text-center font-bold"
            />
          </div>
        </div>
      </div>

      {/* Mode Summary & Effective Address Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel-card p-4">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Active Mode</div>
          <div className="font-mono text-lg font-black text-cyan-700 dark:text-cyan-300 my-1 truncate">
            {result.modeName}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Syntax: <span className="font-bold text-slate-900 dark:text-white">{result.syntax}</span>
          </div>
        </div>

        <div className="panel-card p-4">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Effective Address (EA)</div>
          <div className="font-mono text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300 my-1 truncate">
            {result.effectiveAddress !== null ? result.effectiveAddress : 'None (Immediate/Reg)'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Memory Ref: <span className="font-bold text-slate-900 dark:text-white">{result.memoryAccessCount} accesses</span>
          </div>
        </div>

        <div className="panel-card p-4">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Fetched Operand Value</div>
          <div className="font-mono text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 my-1 truncate">
            {result.operandValue}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            ALU Operand: <span className="font-bold text-slate-900 dark:text-white">{result.operandValue}</span>
          </div>
        </div>

        <div className="panel-card p-4">
          <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">Current Evaluation Stage</div>
          <div className="font-mono text-base font-black text-indigo-800 dark:text-indigo-300 my-1 truncate">
            {activeStep?.stage}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Visual Memory & Register Architecture Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Register Bank */}
        <div className="panel-card p-4 shadow-xl">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> CPU Registers
          </h3>

          <div className="space-y-2">
            <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs transition-all ${
              activeStep?.registersHighlighted?.includes('PC') ? 'border-amber-500 bg-amber-500/10 shadow-sm' : 'sub-panel border'
            }`}>
              <span className="text-amber-700 dark:text-amber-400 font-bold">Program Counter (PC)</span>
              <span className="text-slate-900 dark:text-white font-black">{pc}</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs transition-all ${
              activeStep?.registersHighlighted?.includes('IX') ? 'border-emerald-500 bg-emerald-500/10 shadow-sm' : 'sub-panel border'
            }`}>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">Index Register (IX)</span>
              <span className="text-slate-900 dark:text-white font-black">{ix}</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs transition-all ${
              activeStep?.registersHighlighted?.includes('R1') ? 'border-indigo-500 bg-indigo-500/10 shadow-sm' : 'sub-panel border'
            }`}>
              <span className="text-indigo-700 dark:text-indigo-400 font-bold">General Register (R1)</span>
              <span className="text-slate-900 dark:text-white font-black">{r1}</span>
            </div>
          </div>
        </div>

        {/* Memory Grid */}
        <div className="panel-card p-4 shadow-xl lg:col-span-2">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Main Memory Segment
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sub-panel text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5">Address</th>
                  <th className="p-2.5">Stored Value</th>
                  <th className="p-2.5">Role / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {result.memoryMap.map((m) => {
                  const isHighlighted = activeStep?.memoryHighlighted?.includes(m.address);
                  return (
                    <tr
                      key={m.address}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-cyan-500/15 text-slate-950 dark:text-white font-bold border-l-4 border-cyan-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">{m.address}</td>
                      <td className="p-2.5 text-slate-900 dark:text-white font-black">{m.value}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">{m.label || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Explanation Card */}
      <ExplanationCard
        title={`${result.modeName}: ${activeStep?.description}`}
        badge={activeStep?.stage}
        badgeColor={
          activeStep?.stage === 'INSTRUCTION_DECODE' ? 'cyan' :
          activeStep?.stage === 'EA_CALCULATION' ? 'amber' : 'emerald'
        }
        actionTaken={activeStep?.formula}
        explanation={activeStep?.explanation || ''}
        subNotes={[
          `Mode: ${result.modeName} (${result.syntax})`,
          `Memory Access Count: ${result.memoryAccessCount}`,
          `Effective Address Formula: ${activeStep?.formula || ''}`,
        ]}
      />

      {/* Universal Controller Bar */}
      <ControllerBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        onJumpToStart={handleJumpToStart}
        onJumpToEnd={handleJumpToEnd}
        speed={speed}
        onChangeSpeed={setSpeed}
        statusText={`Addressing: ${result.modeName} ➔ Operand = ${result.operandValue}`}
      />
    </div>
  );
};
