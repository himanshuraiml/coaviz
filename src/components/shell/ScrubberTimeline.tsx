import React, { useRef, useState } from 'react';

export interface TimelinePhase {
  stepIndex: number;
  label: string;
  category?: 'init' | 'compute' | 'shift' | 'fetch' | 'decode' | 'execute' | 'result' | 'default';
}

interface ScrubberTimelineProps {
  currentStep: number;
  totalSteps: number;
  onSeek: (stepIndex: number) => void;
  phases?: TimelinePhase[];
}

export const ScrubberTimeline: React.FC<ScrubberTimelineProps> = ({
  currentStep,
  totalSteps,
  onSeek,
  phases = [],
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  if (totalSteps <= 1) return null;

  const calculateStepFromMouseEvent = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pos * (totalSteps - 1));
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetStep = calculateStepFromMouseEvent(e.clientX);
    onSeek(targetStep);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const step = calculateStepFromMouseEvent(e.clientX);
    setHoverStep(step);
  };

  const handleMouseLeave = () => {
    setHoverStep(null);
  };

  const progressPercent = (currentStep / (totalSteps - 1)) * 100;
  const hoverPercent = hoverStep !== null ? (hoverStep / (totalSteps - 1)) * 100 : null;

  return (
    <div className="w-full select-none py-1.5">
      {/* Scrubber Track Container */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-4 group cursor-pointer flex items-center"
      >
        {/* Background Track */}
        <div className="w-full h-2 bg-card-surface border border-border-main rounded-full overflow-hidden relative shadow-inner">
          {/* Active Progress Fill */}
          <div
            className="h-full bg-gradient-to-r from-accent-primary via-cyan-500 to-accent-secondary transition-all duration-150 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Hover Preview Indicator */}
          {hoverPercent !== null && (
            <div
              className="absolute top-0 bottom-0 bg-accent-primary/20 pointer-events-none rounded-full"
              style={{
                left: `${Math.min(progressPercent, hoverPercent)}%`,
                width: `${Math.abs(hoverPercent - progressPercent)}%`,
              }}
            />
          )}
        </div>

        {/* Phase Tick Markers */}
        {phases.map((phase, idx) => {
          const phasePercent = (phase.stepIndex / (totalSteps - 1)) * 100;
          const isPassed = currentStep >= phase.stepIndex;
          return (
            <div
              key={idx}
              className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center group/marker"
              style={{ left: `${phasePercent}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(phase.stepIndex);
              }}
            >
              <div
                className={`w-2.5 h-4 rounded-sm border transition-all ${
                  isPassed
                    ? 'bg-accent-primary border-white dark:border-slate-900 shadow-sm'
                    : 'bg-card-bg border-border-main group-hover/marker:border-accent-primary'
                }`}
              />
              <span className="hidden group-hover/marker:block absolute -top-7 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg whitespace-nowrap z-30">
                {phase.label} (Step {phase.stepIndex + 1})
              </span>
            </div>
          );
        })}

        {/* Current Thumb Handle */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-950 border-2 border-accent-primary shadow-md flex items-center justify-center pointer-events-none transition-all duration-100 group-hover:scale-125"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
        </div>

        {/* Tooltip on Hover */}
        {hoverStep !== null && (
          <div
            className="absolute -top-8 transform -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-[11px] font-bold shadow-xl pointer-events-none z-30 whitespace-nowrap"
            style={{ left: `${hoverPercent}%` }}
          >
            Seek to Step {hoverStep + 1}
          </div>
        )}
      </div>

      {/* Discrete Step Indicators for small/medium step counts */}
      {totalSteps <= 24 && (
        <div className="flex justify-between items-center px-1 mt-1 text-[10px] font-mono text-text-faint">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => onSeek(i)}
              className={`hover:text-accent-primary transition-colors ${
                currentStep === i ? 'text-accent-primary font-extrabold' : ''
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
