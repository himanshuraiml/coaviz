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
    fill: 'rgb(var(--card-bg))', stroke: 'rgb(var(--border-main))', activeFill: 'rgb(var(--card-surface))',
    activeStroke: 'rgb(var(--accent-primary))', labelColor: 'rgb(var(--text-muted))', valueColor: 'rgb(var(--accent-primary))',
  },
  indigo: {
    fill: 'rgb(var(--card-bg))', stroke: 'rgb(var(--border-main))', activeFill: 'rgb(var(--card-surface))',
    activeStroke: 'rgb(var(--accent-secondary))', labelColor: 'rgb(var(--text-muted))', valueColor: 'rgb(var(--accent-secondary))',
  },
  amber: {
    fill: 'rgb(var(--card-bg))', stroke: 'rgb(var(--border-main))', activeFill: 'rgb(var(--card-surface))',
    activeStroke: 'rgb(var(--accent-amber))', labelColor: 'rgb(var(--text-muted))', valueColor: 'rgb(var(--accent-amber))',
  },
  emerald: {
    fill: 'rgb(var(--card-bg))', stroke: 'rgb(var(--border-main))', activeFill: 'rgb(var(--card-surface))',
    activeStroke: 'rgb(var(--accent-emerald))', labelColor: 'rgb(var(--text-muted))', valueColor: 'rgb(var(--accent-emerald))',
  },
  rose: {
    fill: 'rgb(var(--card-bg))', stroke: 'rgb(var(--border-main))', activeFill: 'rgb(var(--card-surface))',
    activeStroke: 'rgb(var(--accent-rose))', labelColor: 'rgb(var(--text-muted))', valueColor: 'rgb(var(--accent-rose))',
  },
  purple: {
    fill: 'rgb(var(--card-bg))', stroke: 'rgb(var(--border-main))', activeFill: 'rgb(var(--card-surface))',
    activeStroke: '#a855f7', labelColor: 'rgb(var(--text-muted))', valueColor: '#9333ea',
  },
  slate: {
    fill: 'rgb(var(--card-bg))', stroke: 'rgb(var(--border-main))', activeFill: 'rgb(var(--card-surface))',
    activeStroke: 'var(--wire-color)', labelColor: 'rgb(var(--text-muted))', valueColor: 'rgb(var(--text-heading))',
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
        fill={isActive ? c.activeFill : c.fill}
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
        fill={isActive ? c.activeStroke : 'rgb(var(--text-muted))'}
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
          fill="rgb(var(--text-faint))"
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
          fill={isActive ? c.valueColor : 'rgb(var(--text-heading))'}
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
