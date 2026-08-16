import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Gauge
} from 'lucide-react';
import { ScrubberTimeline, TimelinePhase } from './ScrubberTimeline.tsx';

interface ControllerBarProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onSeekStep?: (stepIndex: number) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  statusText?: string;
  phases?: TimelinePhase[];
}

export const ControllerBar: React.FC<ControllerBarProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  onJumpToStart,
  onJumpToEnd,
  onSeekStep,
  speed,
  onChangeSpeed,
  statusText,
  phases = [],
}) => {
  const isStart = currentStep <= 0;
  const isEnd = currentStep >= totalSteps - 1;
  const speeds = [0.5, 1, 1.5, 2, 3];

  return (
    <div className="bg-card-bg border-2 border-border-main/80 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 sticky bottom-3 sm:bottom-4 z-30 shadow-2xl backdrop-blur-md transition-all">
      {/* Top row: Status & Scrubber */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Step Indicator & Status Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card-surface border border-border-main font-mono text-xs sm:text-sm shadow-sm">
            <span className="text-accent-primary font-black">
              Step {totalSteps > 0 ? currentStep + 1 : 0}
            </span>
            <span className="text-text-faint">/</span>
            <span className="text-text-heading font-bold">{totalSteps}</span>
          </div>

          {statusText && (
            <span className="text-xs font-semibold text-text-heading bg-card-surface px-3 py-1 rounded-xl border border-border-main truncate max-w-xs md:max-w-md shadow-sm">
              {statusText}
            </span>
          )}
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5 bg-card-surface p-1 rounded-xl border border-border-main text-xs self-end sm:self-auto shadow-sm">
          <div className="flex items-center gap-1 px-1.5 text-[11px] font-bold text-text-muted">
            <Gauge className="w-3.5 h-3.5 text-accent-primary" />
            <span className="hidden sm:inline">Speed:</span>
          </div>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded-lg font-mono text-xs transition-all ${
                speed === s
                  ? 'font-black bg-accent-primary text-white shadow-sm'
                  : 'font-bold text-text-muted hover:text-text-heading hover:bg-card-subtle'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Visual Scrubber Timeline */}
      {onSeekStep && totalSteps > 1 && (
        <ScrubberTimeline
          currentStep={currentStep}
          totalSteps={totalSteps}
          onSeek={onSeekStep}
          phases={phases}
        />
      )}

      {/* Bottom row: Control Buttons Bar */}
      <div className="flex items-center justify-center sm:justify-between gap-2 pt-1 border-t border-border-main/50 flex-wrap">
        {/* Secondary Jump Left */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            title="Reset Simulation (Key: R)"
            className="p-2.5 rounded-xl bg-card-surface border border-border-main hover:border-text-muted text-text-body font-bold active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onJumpToStart}
            disabled={isStart}
            title="Jump to Start (Key: Home)"
            className="p-2.5 rounded-xl bg-card-surface border border-border-main hover:border-text-muted text-text-body font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </div>

        {/* Core Primary Navigation (Prev, Play, Next) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStepBackward}
            disabled={isStart}
            title="Step Backward (Key: ←)"
            className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-card-surface border border-border-main hover:border-accent-primary text-text-heading font-bold text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-accent-primary" />
            <span>Prev</span>
          </button>

          {/* Hero Auto-Step / Pause Button */}
          <button
            onClick={onTogglePlay}
            title={isPlaying ? "Pause Simulation (Key: Space)" : "Play Auto-Step Simulation (Key: Space)"}
            className={`px-5 sm:px-7 py-2.5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all ${
              isPlaying
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/25'
                : 'bg-gradient-to-r from-accent-primary via-cyan-600 to-accent-secondary shadow-accent-primary/25'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{isEnd ? 'Replay' : 'Auto Step'}</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={isEnd}
            title="Step Forward (Key: →)"
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-black text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Jump Right */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onJumpToEnd}
            disabled={isEnd}
            title="Jump to Result (Key: End)"
            className="p-2.5 rounded-xl bg-card-surface border border-border-main hover:border-text-muted text-text-body font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
