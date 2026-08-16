import React, { useEffect, useRef } from 'react';

export type WireType = 'data' | 'address' | 'control';
export type WireDir = 'h' | 'v' | 'elbow-right' | 'elbow-left';

interface AnimatedWireProps {
  x1: number; y1: number;
  x2: number; y2: number;
  type?: WireType;
  active?: boolean;
  value?: string;       // label shown on the travelling packet
  dir?: WireDir;        // elbow variants add a corner
  duration?: number;    // ms for packet to traverse
  /** resets the packet animation when this key changes */
  animKey?: string | number;
}

const TYPE_COLOR: Record<WireType, { stroke: string; packet: string; text: string }> = {
  data:    { stroke: '#0284c7', packet: '#0284c7', text: '#fff' },
  address: { stroke: '#d97706', packet: '#d97706', text: '#fff' },
  control: { stroke: '#e11d48', packet: '#e11d48', text: '#fff' },
};

/** Builds an SVG path string for either straight or elbow wires */
function buildPath(x1: number, y1: number, x2: number, y2: number, dir: WireDir): string {
  if (dir === 'h' || dir === 'v') {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  // Elbow: go horizontally to midpoint x, then vertically to y2
  if (dir === 'elbow-right') {
    return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
  }
  // Elbow: go vertically to midpoint y, then horizontally to x2
  if (dir === 'elbow-left') {
    return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export const AnimatedWire: React.FC<AnimatedWireProps> = ({
  x1, y1, x2, y2,
  type = 'data',
  active = false,
  value,
  dir = 'h',
  duration = 800,
  animKey,
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const packetRef = useRef<SVGGElement>(null);
  const colors = TYPE_COLOR[type];
  const pathD = buildPath(x1, y1, x2, y2, dir);

  // Trigger packet animation whenever active becomes true or animKey changes
  useEffect(() => {
    if (!active || !pathRef.current || !packetRef.current) return;
    const path = pathRef.current;
    const packet = packetRef.current;
    const totalLen = path.getTotalLength();

    let start: number | null = null;
    let rafId: number;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out quad
      const pt = path.getPointAtLength(eased * totalLen);
      packet.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
      packet.style.opacity = t < 0.05 ? '0' : t > 0.92 ? String(1 - (t - 0.92) / 0.08) : '1';
      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    packet.style.opacity = '0';
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [active, animKey, duration]);

  const labelW = value ? Math.max(40, value.length * 7 + 10) : 0;
  const labelH = 16;

  return (
    <g>
      {/* Background/idle wire */}
      <path
        d={pathD}
        stroke={active ? colors.stroke : 'var(--wire-color)'}
        strokeWidth={active ? 2.5 : 1.5}
        fill="none"
        strokeDasharray={active ? 'none' : '5 4'}
        style={{ transition: 'stroke 0.25s, stroke-width 0.25s' }}
      />
      {/* Animated glow overlay when active */}
      {active && (
        <path
          d={pathD}
          stroke={colors.stroke}
          strokeWidth={6}
          fill="none"
          opacity={0.22}
        />
      )}

      {/* Arrowhead at destination */}
      {active && (() => {
        // Compute angle for arrowhead
        const angle = dir === 'h' ? (x2 > x1 ? 0 : 180) :
                      dir === 'v' ? (y2 > y1 ? 90 : 270) :
                      dir === 'elbow-right' ? (y2 > y1 ? 90 : 270) :
                      (x2 > x1 ? 0 : 180);
        return (
          <polygon
            points={`0,-5 10,0 0,5`}
            fill={colors.packet}
            transform={`translate(${x2},${y2}) rotate(${angle})`}
          />
        );
      })()}

      {/* Moving packet */}
      {active && (
        <g ref={packetRef} style={{ opacity: 0 }}>
          <rect
            x={-labelW / 2} y={-labelH / 2}
            width={labelW} height={labelH}
            rx={4}
            fill={colors.packet}
            stroke="white"
            strokeWidth={1}
          />
          {value && (
            <text
              x={0} y={1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={colors.text}
              fontSize={9}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="800"
            >
              {value.length > 14 ? value.slice(0, 13) + '…' : value}
            </text>
          )}
        </g>
      )}
    </g>
  );
};
