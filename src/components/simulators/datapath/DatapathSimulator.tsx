import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  createInitialCpuState, 
  assembleInstruction, 
  executeInstructionStepByStep, 
  CpuRegisters, 
  DatapathStep, 
  INSTRUCTION_SET 
} from '../../../engines/cpu/datapath.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { HardwareBus } from '../../schematic/HardwareBus.tsx';
import { XRayModal, XRayComponentType } from '../../schematic/XRayModal.tsx';
import { ClockWaveformTimeline } from '../../schematic/ClockWaveformTimeline.tsx';
import { Cpu, Database, Zap, Sparkles, ZoomIn, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export const DatapathSimulator: React.FC = () => {
  const [selectedInstruction, setSelectedInstruction] = useState<string>('ADD');
  const [addressOperand, setAddressOperand] = useState<number>(0x200);
  const [isIndirect, setIsIndirect] = useState<boolean>(false);
  const [initialAC, setInitialAC] = useState<number>(0x0015);
  const [memoryDataValue, setMemoryDataValue] = useState<number>(0x002A);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // X-Ray Inspector state
  const [xrayType, setXrayType] = useState<XRayComponentType | null>(null);

  // Initialize and execute instruction
  const simulation = useMemo(() => {
    const { registers, memory } = createInitialCpuState();
    registers.PC = 0x100;
    registers.AC = initialAC;

    // Assemble and put instruction at PC (0x100)
    const machineCode = assembleInstruction(selectedInstruction, addressOperand, isIndirect);
    memory[0x100] = machineCode;

    // Setup operand memory location
    if (isIndirect) {
      memory[addressOperand] = 0x300; // Pointer to 0x300
      memory[0x300] = memoryDataValue;
    } else {
      memory[addressOperand] = memoryDataValue;
    }

    const { steps } = executeInstructionStepByStep(registers, memory);
    return { steps, memory, machineCode };
  }, [selectedInstruction, addressOperand, isIndirect, initialAC, memoryDataValue]);

  const steps = simulation.steps;
  const totalSteps = steps.length;
  const activeStep: DatapathStep = steps[currentStep] || steps[0];
  const reg: CpuRegisters = activeStep?.registers || createInitialCpuState().registers;

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

  // Confetti on instruction completion
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

  const presets = [
    { label: 'ADD 0x200 (AC + M[200])', inst: 'ADD', addr: 0x200, ind: false, ac: 0x0015, data: 0x002A },
    { label: 'LDA 0x200 (AC ← M[200])', inst: 'LDA', addr: 0x200, ind: false, ac: 0x0000, data: 0xABCD },
    { label: 'STA 0x250 (M[250] ← AC)', inst: 'STA', addr: 0x250, ind: false, ac: 0x9999, data: 0x0000 },
    { label: 'BUN 0x400 (Branch)', inst: 'BUN', addr: 0x400, ind: false, ac: 0x0000, data: 0x0000 },
    { label: 'CLA (Clear AC)', inst: 'CLA', addr: 0x000, ind: false, ac: 0x1234, data: 0x0000 },
    { label: 'INC (Increment AC)', inst: 'INC', addr: 0x000, ind: false, ac: 0x000F, data: 0x0000 },
    { label: 'Indirect LDA @0x200', inst: 'LDA', addr: 0x200, ind: true, ac: 0x0000, data: 0x5555 },
  ];

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto">
      {/* X-Ray Cutaway Modal */}
      {xrayType && (
        <XRayModal
          isOpen={!!xrayType}
          onClose={() => setXrayType(null)}
          componentType={xrayType}
          activeData={{
            operandA: `0x${reg.AC.toString(16).padStart(4, '0').toUpperCase()}`,
            operandB: `0x${reg.DR.toString(16).padStart(4, '0').toUpperCase()}`,
            result: activeStep?.busValueHex,
            operation: selectedInstruction,
            controlWord: activeStep?.activeControlSignals?.join(', '),
            flags: {
              Z: reg.AC === 0,
              S: (reg.AC & 0x8000) !== 0,
              C: reg.E === 1,
              V: false,
            },
          }}
        />
      )}

      {/* Configuration & Instruction Loader */}
      <div className="panel-card p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedInstruction(p.inst);
                setAddressOperand(p.addr);
                setIsIndirect(p.ind);
                setInitialAC(p.ac);
                setMemoryDataValue(p.data);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedInstruction === p.inst && isIndirect === p.ind && addressOperand === p.addr
                  ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'sub-panel border text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Instruction Builder */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 sub-panel px-3 py-1.5 border">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Opcode:</label>
            <select
              value={selectedInstruction}
              onChange={(e) => {
                setSelectedInstruction(e.target.value);
                setCurrentStep(0);
              }}
              className="input-box px-2 py-0.5 text-xs text-cyan-700 dark:text-cyan-300 font-bold"
            >
              {Object.keys(INSTRUCTION_SET).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {INSTRUCTION_SET[selectedInstruction]?.type === 'MRI' && (
            <>
              <div className="flex items-center gap-2 sub-panel px-3 py-1.5 border">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Address (Hex):</label>
                <input
                  type="text"
                  value={addressOperand.toString(16).toUpperCase()}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 16);
                    if (!isNaN(parsed)) setAddressOperand(parsed & 0x0fff);
                    setCurrentStep(0);
                  }}
                  className="w-16 input-box px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 text-center"
                />
              </div>

              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer sub-panel px-3 py-1.5 border">
                <input
                  type="checkbox"
                  checked={isIndirect}
                  onChange={(e) => {
                    setIsIndirect(e.target.checked);
                    setCurrentStep(0);
                  }}
                  className="rounded border-slate-400 text-cyan-600 focus:ring-0"
                />
                <span>Indirect (I=1)</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Real-time Oscilloscope Timing & Waveform Analyzer */}
      <ClockWaveformTimeline
        currentStep={currentStep}
        totalSteps={totalSteps}
        timingSignal={activeStep?.timingSignal || 'T0'}
        phaseLabel={activeStep?.phase || 'FETCH'}
        activeSignals={{
          clk: isPlaying || true,
          read: !!activeStep?.memoryRead,
          write: !!activeStep?.memoryWrite,
          load: (activeStep?.activeControlSignals?.length ?? 0) > 0,
        }}
        onStepSelect={(s) => {
          setIsPlaying(false);
          setCurrentStep(s);
        }}
      />

      {/* Central Interactive Datapath Schematic Cross-Section */}
      <div className="panel-card p-6 shadow-2xl relative">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Mano Basic Computer Datapath & Common Bus System
          </h3>
          {/* X-Ray Cutaway Triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setXrayType('ALU')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 transition-all shadow-sm active:scale-95"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>ALU X-Ray</span>
            </button>
            <button
              onClick={() => setXrayType('REGISTER_FILE')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 transition-all shadow-sm active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Registers X-Ray</span>
            </button>
            <button
              onClick={() => setXrayType('CONTROL_UNIT')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-all shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Decoder Matrix</span>
            </button>
          </div>
        </div>

        {/* Dynamic Hardware Bus Line */}
        <div className="mb-4">
          <HardwareBus
            label="16-BIT COMMON SYSTEM BUS"
            bitWidth={16}
            active={activeStep?.busSource !== 'NONE'}
            value={activeStep?.busValueHex || '0x0000'}
            type="data"
          />
        </div>

        {/* Register Grid Layout with Cutaway click handles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {/* PC */}
          <div 
            onClick={() => setXrayType('REGISTER_FILE')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeStep?.busSource === 'PC' || activeStep?.activeControlSignals?.includes('LD_PC')
                ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/20 scale-105'
                : 'sub-panel border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
              <span>PC (Program Counter)</span>
              <span className="text-[9px] font-mono">12b</span>
            </div>
            <div className="font-mono text-lg font-black text-amber-800 dark:text-amber-200">
              0x{reg.PC.toString(16).padStart(3, '0').toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Dec: {reg.PC}</span>
              <span className="text-amber-600 dark:text-amber-400 text-[9px] font-bold flex items-center gap-0.5"><ZoomIn className="w-2.5 h-2.5" /> Latch</span>
            </div>
          </div>

          {/* AR */}
          <div 
            onClick={() => setXrayType('REGISTER_FILE')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeStep?.busSource === 'AR' || activeStep?.activeControlSignals?.includes('LD_AR')
                ? 'border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-500/20 scale-105'
                : 'sub-panel border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1">
              <span>AR (Address Register)</span>
              <span className="text-[9px] font-mono">12b</span>
            </div>
            <div className="font-mono text-lg font-black text-cyan-800 dark:text-cyan-200">
              0x{reg.AR.toString(16).padStart(3, '0').toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Dec: {reg.AR}</span>
              <span className="text-cyan-600 dark:text-cyan-400 text-[9px] font-bold flex items-center gap-0.5"><ZoomIn className="w-2.5 h-2.5" /> Latch</span>
            </div>
          </div>

          {/* DR */}
          <div 
            onClick={() => setXrayType('REGISTER_FILE')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeStep?.busSource === 'DR' || activeStep?.activeControlSignals?.includes('LD_DR')
                ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/20 scale-105'
                : 'sub-panel border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
              <span>DR (Data Register)</span>
              <span className="text-[9px] font-mono">16b</span>
            </div>
            <div className="font-mono text-lg font-black text-indigo-800 dark:text-indigo-200">
              0x{reg.DR.toString(16).padStart(4, '0').toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Dec: {reg.DR}</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-[9px] font-bold flex items-center gap-0.5"><ZoomIn className="w-2.5 h-2.5" /> Latch</span>
            </div>
          </div>

          {/* AC (Accumulator) */}
          <div 
            onClick={() => setXrayType('ALU')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeStep?.busSource === 'AC' || activeStep?.activeControlSignals?.includes('LD_AC')
                ? 'border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/20 scale-105'
                : 'sub-panel border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              <span>AC (Accumulator / ALU)</span>
              <span className="text-[9px] font-mono">16b</span>
            </div>
            <div className="font-mono text-lg font-black text-emerald-800 dark:text-emerald-200">
              0x{reg.AC.toString(16).padStart(4, '0').toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Dec: {reg.AC}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[9px] font-bold flex items-center gap-0.5"><ZoomIn className="w-2.5 h-2.5" /> ALU Core</span>
            </div>
          </div>

          {/* IR */}
          <div 
            onClick={() => setXrayType('CONTROL_UNIT')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeStep?.busSource === 'IR' || activeStep?.activeControlSignals?.includes('LD_IR')
                ? 'border-rose-500 bg-rose-500/10 shadow-md shadow-rose-500/20 scale-105'
                : 'sub-panel border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
              <span>IR (Instruction Register)</span>
              <span className="text-[9px] font-mono">16b</span>
            </div>
            <div className="font-mono text-lg font-black text-rose-800 dark:text-rose-200">
              0x{reg.IR.toString(16).padStart(4, '0').toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Op: {(reg.IR >> 12) & 0x7}</span>
              <span className="text-rose-600 dark:text-rose-400 text-[9px] font-bold flex items-center gap-0.5"><ZoomIn className="w-2.5 h-2.5" /> PLA Decoder</span>
            </div>
          </div>

          {/* TR */}
          <div className="p-3.5 rounded-xl sub-panel border">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              <span>TR (Temporary Register)</span>
              <span className="text-[9px] font-mono">16b</span>
            </div>
            <div className="font-mono text-lg font-bold text-slate-800 dark:text-slate-200">
              0x{reg.TR.toString(16).padStart(4, '0').toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Dec: {reg.TR}</div>
          </div>

          {/* Memory Block 4096x16 */}
          <div 
            onClick={() => setXrayType('SRAM_CELL')}
            className={`p-3.5 rounded-xl border col-span-2 cursor-pointer transition-all ${
              activeStep?.memoryRead || activeStep?.memoryWrite
                ? 'border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-500/20'
                : 'sub-panel border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-cyan-800 dark:text-cyan-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Memory (4096 × 16 SRAM)
              </span>
              <span className="text-[10px] font-mono flex items-center gap-1 font-bold">
                <ZoomIn className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                {activeStep?.memoryRead ? 'READING' : activeStep?.memoryWrite ? 'WRITING' : 'IDLE'}
              </span>
            </div>
            <div className="font-mono text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between mt-1">
              <span>Active Addr: <strong className="text-cyan-700 dark:text-cyan-300 font-black">0x{(activeStep?.activeMemoryAddress ?? reg.AR).toString(16).toUpperCase()}</strong></span>
              <span>Value: <strong className="text-slate-900 dark:text-white font-black">0x{(simulation.memory[activeStep?.activeMemoryAddress ?? reg.AR] || 0).toString(16).padStart(4, '0').toUpperCase()}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Explanation Card */}
      <ExplanationCard
        title={`${activeStep?.timingSignal || 'T0'}: ${activeStep?.microOperation || ''}`}
        badge={activeStep?.phase}
        badgeColor={
          activeStep?.phase === 'FETCH' ? 'cyan' :
          activeStep?.phase === 'DECODE' ? 'amber' :
          activeStep?.phase === 'INDIRECT' ? 'rose' : 'emerald'
        }
        actionTaken={activeStep?.explanation}
        explanation="The basic computer datapath coordinates micro-operations across the common bus through timing control signals generated by the instruction decoder and sequence counter."
        subNotes={[
          `Active Control Signals: ${activeStep?.activeControlSignals?.join(', ') || 'None'}`,
          `Common Bus is driven by ${activeStep?.busSource} (Selector: ${activeStep?.busSelector})`,
        ]}
      />

      {/* Controller Bar */}
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
        statusText={`Datapath: ${selectedInstruction} (${activeStep?.timingSignal}: ${activeStep?.microOperation})`}
      />
    </div>
  );
};
