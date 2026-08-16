import React from 'react';
import { Activity, Clock } from 'lucide-react';

export interface ClockWaveformTimelineProps {
  currentStep: number;
  totalSteps: number;
  activeSignals?: {
    clk?: boolean;
    read?: boolean;
    write?: boolean;
    load?: boolean;
  };
  timingSignal?: string;
  phaseLabel?: string;
  onStepSelect?: (step: number) => void;
  className?: string;
}

export const ClockWaveformTimeline: React.FC<ClockWaveformTimelineProps> = ({
  currentStep,
  totalSteps,
  activeSignals = { clk: true, read: false, write: false, load: false },
  timingSignal = 'T0',
  phaseLabel = 'FETCH',
  onStepSelect,
  className = '',
}) => {
  const stepsArray = Array.from({ length: Math.max(totalSteps, 1) }, (_, i) => i);

  return (
    <div className={`panel-card p-4 space-y-3 ${className}`}>
      {/* Top Header & Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>REAL-TIME TIMING & LOGIC WAVEFORM ANALYZER</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
            Timing: {timingSignal}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30">
            {phaseLabel}
          </span>
        </div>
      </div>

      {/* Logic Signals Grid */}
      <div className="space-y-2.5 font-mono text-xs">
        {/* CLK Signal */}
        <div className="flex items-center gap-3">
          <div className="w-16 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            CLK
          </div>
          <div className="flex-1 flex items-center gap-1.5 sub-panel p-1.5 border">
            {stepsArray.map((idx) => {
              const isCurrent = idx === currentStep;
              return (
                <button
                  key={idx}
                  onClick={() => onStepSelect && onStepSelect(idx)}
                  className={`flex-1 h-7 rounded-lg flex items-center justify-center font-mono transition-all ${
                    isCurrent
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-black shadow-md shadow-cyan-500/25 scale-[1.03]'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  <span className="text-[11px]">T{idx}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Read / Write / Load Waveform Indicators */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            activeSignals.read
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
              : 'sub-panel border text-slate-500 dark:text-slate-400'
          }`}>
            <span className="font-semibold">READ (RD):</span>
            <span className="font-mono font-black">{activeSignals.read ? 'HIGH (1)' : 'LOW (0)'}</span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            activeSignals.write
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-800 dark:text-rose-300 font-bold shadow-sm'
              : 'sub-panel border text-slate-500 dark:text-slate-400'
          }`}>
            <span className="font-semibold">WRITE (WR):</span>
            <span className="font-mono font-black">{activeSignals.write ? 'HIGH (1)' : 'LOW (0)'}</span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            activeSignals.load
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-800 dark:text-amber-300 font-bold shadow-sm'
              : 'sub-panel border text-slate-500 dark:text-slate-400'
          }`}>
            <span className="font-semibold">REG LOAD (LD):</span>
            <span className="font-mono font-black">{activeSignals.load ? 'ACTIVE (1)' : 'IDLE (0)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
