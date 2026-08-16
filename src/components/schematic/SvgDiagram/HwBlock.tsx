import React from 'react';

export type BlockColor = 'cyan' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate' | 'purple';

interface HwBlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  sublabel?: string;
  value?: string;
  color?: BlockColor;
  isActive?: boolean;
  onClick?: () => void;
}

const COLOR_MAP: Record<BlockColor, {
  fill: string; stroke: string; activeFill: string; activeStroke: string;
  labelColor: string; valueColor: string;
}> = {
  cyan: {
    fill: 'var(--card-bg)', stroke: 'var(--border-main)', activeFill: 'var(--card-surface)',
    activeStroke: 'var(--accent-primary)', labelColor: 'var(--text-muted)', valueColor: 'var(--accent-primary)',
  },
  indigo: {
    fill: 'var(--card-bg)', stroke: 'var(--border-main)', activeFill: 'var(--card-surface)',
    activeStroke: 'var(--accent-secondary)', labelColor: 'var(--text-muted)', valueColor: 'var(--accent-secondary)',
  },
  amber: {
    fill: 'var(--card-bg)', stroke: 'var(--border-main)', activeFill: 'var(--card-surface)',
    activeStroke: 'var(--accent-amber)', labelColor: 'var(--text-muted)', valueColor: 'var(--accent-amber)',
  },
  emerald: {
    fill: 'var(--card-bg)', stroke: 'var(--border-main)', activeFill: 'var(--card-surface)',
    activeStroke: 'var(--accent-emerald)', labelColor: 'var(--text-muted)', valueColor: 'var(--accent-emerald)',
  },
  rose: {
    fill: 'var(--card-bg)', stroke: 'var(--border-main)', activeFill: 'var(--card-surface)',
    activeStroke: 'var(--accent-rose)', labelColor: 'var(--text-muted)', valueColor: 'var(--accent-rose)',
  },
  purple: {
    fill: 'var(--card-bg)', stroke: 'var(--border-main)', activeFill: 'var(--card-surface)',
    activeStroke: '#a855f7', labelColor: 'var(--text-muted)', valueColor: '#9333ea',
  },
  slate: {
    fill: 'var(--card-bg)', stroke: 'var(--border-main)', activeFill: 'var(--card-surface)',
    activeStroke: 'var(--wire-color)', labelColor: 'var(--text-muted)', valueColor: 'var(--text-heading)',
  },
};

export const HwBlock: React.FC<HwBlockProps> = ({
  x, y, width, height,
  label, sublabel, value,
  color = 'slate',
  isActive = false,
  onClick,
}) => {
  const c = COLOR_MAP[color];
  const rx = 8;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      className={isActive ? 'block-active' : ''}
    >
      {/* Drop-shadow highlight outline when active */}
      {isActive && (
        <rect
          x={-2} y={-2}
          width={width + 4} height={height + 4}
          rx={rx + 2}
          fill="none"
          stroke={c.activeStroke}
          strokeWidth={2}
          opacity={0.5}
        />
      )}

      {/* Main block rectangle */}
      <rect
        width={width} height={height}
        rx={rx}
        fill={c.fill}
        stroke={isActive ? c.activeStroke : c.stroke}
        strokeWidth={isActive ? 2.5 : 1.5}
        style={{
          transition: 'fill 0.25s, stroke 0.25s',
        }}
      />

      {/* Label (top) */}
      <text
        x={width / 2}
        y={sublabel || value ? height * 0.34 : height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isActive ? c.activeStroke : 'var(--text-muted)'}
        fontSize={10}
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
      >
        {label}
      </text>

      {/* Sublabel */}
      {sublabel && !value && (
        <text
          x={width / 2}
          y={height * 0.68}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-faint)"
          fontSize={9}
          fontWeight="600"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {sublabel}
        </text>
      )}

      {/* Value readout */}
      {value && (
        <text
          x={width / 2}
          y={height * 0.68}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isActive ? c.valueColor : 'var(--text-heading)'}
          fontSize={11}
          fontWeight="800"
          fontFamily="'JetBrains Mono', monospace"
        >
          {value}
        </text>
      )}
    </g>
  );
};
