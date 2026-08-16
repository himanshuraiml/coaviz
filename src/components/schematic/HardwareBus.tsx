import React from 'react';

export interface HardwareBusProps {
  id?: string;
  from?: string;
  to?: string;
  label?: string;
  bitWidth?: number | string;
  active?: boolean;
  value?: string | number;
  type?: 'data' | 'address' | 'control' | 'clock';
  direction?: 'horizontal' | 'vertical' | 'custom';
  className?: string;
}

export const HardwareBus: React.FC<HardwareBusProps> = ({
  label,
  bitWidth = 16,
  active = false,
  value,
  type = 'data',
  className = '',
}) => {
  const getTypeColors = () => {
    switch (type) {
      case 'address':
        return active
          ? {
              border: 'border-amber-400 dark:border-amber-400',
              bg: 'bg-amber-500/10 dark:bg-amber-950/40',
              text: 'text-amber-600 dark:text-amber-300',
              particle: 'bg-amber-400 shadow-amber-400/50',
              glow: 'shadow-md shadow-amber-500/20',
            }
          : {
              border: 'border-slate-300 dark:border-slate-800',
              bg: 'bg-slate-100/50 dark:bg-slate-900/30',
              text: 'text-slate-400 dark:text-slate-500',
              particle: 'bg-slate-400',
              glow: '',
            };
      case 'control':
        return active
          ? {
              border: 'border-rose-400 dark:border-rose-400',
              bg: 'bg-rose-500/10 dark:bg-rose-950/40',
              text: 'text-rose-600 dark:text-rose-300',
              particle: 'bg-rose-400 shadow-rose-400/50',
              glow: 'shadow-md shadow-rose-500/20',
            }
          : {
              border: 'border-slate-300 dark:border-slate-800',
              bg: 'bg-slate-100/50 dark:bg-slate-900/30',
              text: 'text-slate-400 dark:text-slate-500',
              particle: 'bg-slate-400',
              glow: '',
            };
      case 'clock':
        return active
          ? {
              border: 'border-emerald-400 dark:border-emerald-400',
              bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
              text: 'text-emerald-600 dark:text-emerald-300',
              particle: 'bg-emerald-400 shadow-emerald-400/50',
              glow: 'shadow-md shadow-emerald-500/20',
            }
          : {
              border: 'border-slate-300 dark:border-slate-800',
              bg: 'bg-slate-100/50 dark:bg-slate-900/30',
              text: 'text-slate-400 dark:text-slate-500',
              particle: 'bg-slate-400',
              glow: '',
            };
      case 'data':
      default:
        return active
          ? {
              border: 'border-cyan-400 dark:border-cyan-400',
              bg: 'bg-cyan-500/10 dark:bg-cyan-950/40',
              text: 'text-cyan-600 dark:text-cyan-300',
              particle: 'bg-cyan-400 shadow-cyan-400/50',
              glow: 'shadow-md shadow-cyan-500/20',
            }
          : {
              border: 'border-slate-300 dark:border-slate-800',
              bg: 'bg-slate-100/50 dark:bg-slate-900/30',
              text: 'text-slate-400 dark:text-slate-500',
              particle: 'bg-slate-400',
              glow: '',
            };
    }
  };

  const colors = getTypeColors();

  return (
    <div
      className={`relative p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between overflow-hidden ${colors.border} ${colors.bg} ${colors.glow} ${className}`}
    >
      {/* Moving particle / pulse effect when active */}
      {active && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current opacity-10 animate-pulse pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] bg-current opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 -translate-y-1/2 flex items-center justify-around w-full pointer-events-none">
            <span className={`w-2 h-2 rounded-full shadow-lg ${colors.particle} animate-ping`} />
            <span className={`w-2 h-2 rounded-full shadow-lg ${colors.particle}`} />
            <span className={`w-2 h-2 rounded-full shadow-lg ${colors.particle}`} />
          </div>
        </>
      )}

      {/* Bus Label & Bit Width */}
      <div className="flex items-center gap-2 relative z-10">
        <span
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            active ? colors.particle : 'bg-slate-400 dark:bg-slate-700'
          }`}
        />
        <div className="flex flex-col">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
            {label || `${type.toUpperCase()} BUS`}
          </span>
          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
            {bitWidth}-bit line
          </span>
        </div>
      </div>

      {/* Value Readout */}
      {value !== undefined && (
        <div className="relative z-10 flex items-center gap-2">
          <div
            className={`font-mono text-xs font-black px-2 py-0.5 rounded border transition-all ${
              active
                ? `${colors.text} bg-white/90 dark:bg-slate-900/90 border-current shadow-sm`
                : 'text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            {typeof value === 'number'
              ? `0x${value.toString(16).toUpperCase()}`
              : value}
          </div>
        </div>
      )}
    </div>
  );
};
