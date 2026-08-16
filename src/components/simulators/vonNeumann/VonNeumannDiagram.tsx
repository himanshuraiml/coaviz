import React from 'react';
import { VonNeumannStep } from '../../../engines/cpu/vonNeumann.ts';
import { HwBlock } from '../../schematic/SvgDiagram/HwBlock.tsx';
import { AnimatedWire } from '../../schematic/SvgDiagram/AnimatedWire.tsx';

interface VonNeumannDiagramProps {
  step: VonNeumannStep;
  stepIndex: number;
  onClickBlock?: (block: string) => void;
}

// Layout constants (viewBox 900 × 440)
const VB_W = 900;
const VB_H = 440;

// CPU region: x=20..520, Memory region: x=560..880
const CPU_X = 20;
const MEM_X = 560;
const MEM_W = 310;

// Individual block sizes
const BLK_W = 110;
const BLK_H = 44;
const BLK_W_WIDE = 230; // for AC / combined blocks

// Vertical positions
const ROW1_Y = 48;   // CU / ALU
const ROW2_Y = 118;  // PC / IR
const ROW3_Y = 188;  // MAR / MDR
const ROW4_Y = 260;  // AC

// Bus y positions (bottom of CPU area)
const BUS_ADDR_Y = 340;
const BUS_DATA_Y = 368;
const BUS_CTRL_Y = 396;
const BUS_X_START = CPU_X;
const BUS_X_END = MEM_X + MEM_W - 10;

export const VonNeumannDiagram: React.FC<VonNeumannDiagramProps> = ({
  step, stepIndex, onClickBlock,
}) => {
  const ac = step.activeComponent;
  const bus = step.activeBus;
  const regs = step.registers;

  // Bus wire payload label (short)
  const addrLabel = bus === 'ADDRESS_BUS'
    ? `0x${regs.mar.toString(16).toUpperCase().padStart(2, '0')}`
    : undefined;
  const dataLabel = bus === 'DATA_BUS'
    ? (step.busPayload?.slice(0, 18) || `0x${regs.mdr.toString(16).toUpperCase()}`)
    : undefined;
  const ctrlLabel = bus === 'CONTROL_BUS'
    ? regs.cu.activeSignal.slice(0, 16)
    : undefined;

  return (
    <div className="panel-card w-full overflow-hidden p-5 flex flex-col justify-between relative shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
            Von Neumann Hardware Cross-Section
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            Internal 16-Bit Bus Flow
          </span>
        </div>
      </div>

      <div className="w-full sub-panel p-4 border flex items-center justify-center rounded-2xl overflow-x-auto bg-white dark:bg-slate-950">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          style={{ minWidth: 620, maxHeight: 460 }}
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          <defs>
            <linearGradient id="cpuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="memGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* ── CPU boundary box ── */}
          <rect
            x={CPU_X} y={10}
            width={520} height={310}
            rx={16}
            fill="url(#cpuGrad)" stroke="rgb(var(--border-main))" strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <text x={CPU_X + 16} y={30} fill="rgb(var(--accent-primary))" fontSize={11} fontWeight="800" letterSpacing={1}>
            CENTRAL PROCESSING UNIT (CPU)
          </text>

          {/* ── MEMORY boundary box ── */}
          <rect
            x={MEM_X - 10} y={10}
            width={MEM_W + 20} height={310}
            rx={16}
            fill="url(#memGrad)" stroke="rgb(var(--border-main))" strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <text x={MEM_X + 6} y={30} fill="rgb(var(--accent-emerald))" fontSize={11} fontWeight="800" letterSpacing={1}>
            MAIN MEMORY (RAM - Unified)
          </text>

          {/* ════ HARDWARE BLOCKS ════ */}

          {/* CU */}
          <HwBlock
            x={CPU_X + 20} y={ROW1_Y}
            width={BLK_W} height={BLK_H}
            label="Control Unit"
            sublabel={`State: ${regs.cu.state}`}
            color="indigo"
            isActive={ac === 'CU'}
            onClick={() => onClickBlock?.('CONTROL_UNIT')}
          />

          {/* ALU */}
          <HwBlock
            x={CPU_X + 160} y={ROW1_Y}
            width={BLK_W} height={BLK_H}
            label="ALU"
            sublabel={regs.ir.opcode === 'ADD' ? 'ADDER ⚙' : 'STANDBY'}
            color="emerald"
            isActive={ac === 'ALU'}
            onClick={() => onClickBlock?.('ALU')}
          />

          {/* PC */}
          <HwBlock
            x={CPU_X + 20} y={ROW2_Y}
            width={BLK_W} height={BLK_H}
            label="PROG COUNTER (PC)"
            value={`0x0${regs.pc}`}
            color="amber"
            isActive={ac === 'PC'}
            onClick={() => onClickBlock?.('REGISTER_FILE')}
          />

          {/* IR */}
          <HwBlock
            x={CPU_X + 160} y={ROW2_Y}
            width={BLK_W} height={BLK_H}
            label="INSTRUCTION (IR)"
            value={regs.ir.raw.slice(0, 14)}
            color="indigo"
            isActive={ac === 'IR'}
            onClick={() => onClickBlock?.('CONTROL_UNIT')}
          />

          {/* MAR */}
          <HwBlock
            x={CPU_X + 20} y={ROW3_Y}
            width={BLK_W} height={BLK_H}
            label="MEM ADDR (MAR)"
            value={`0x${regs.mar.toString(16).toUpperCase().padStart(2, '0')}`}
            color="cyan"
            isActive={ac === 'MAR'}
            onClick={() => onClickBlock?.('REGISTER_FILE')}
          />

          {/* MDR */}
          <HwBlock
            x={CPU_X + 160} y={ROW3_Y}
            width={BLK_W} height={BLK_H}
            label="MEM BUFFER (MBR/MDR)"
            value={`0x${regs.mdr.toString(16).toUpperCase().padStart(2, '0')}`}
            color="cyan"
            isActive={ac === 'MDR'}
            onClick={() => onClickBlock?.('REGISTER_FILE')}
          />

          {/* AC — full width */}
          <HwBlock
            x={CPU_X + 20} y={ROW4_Y}
            width={BLK_W_WIDE} height={BLK_H}
            label="ACCUMULATOR (AC)"
            value={`${regs.ac}  (0x${regs.ac.toString(16).toUpperCase()})`}
            color="emerald"
            isActive={ac === 'AC'}
            onClick={() => onClickBlock?.('ALU')}
          />

          {/* I/O blocks */}
          <HwBlock
            x={CPU_X + 270} y={ROW3_Y}
            width={90} height={BLK_H}
            label="I/O OUT"
            sublabel={step.ioState.outputVal !== undefined ? `= ${step.ioState.outputVal}` : 'Waiting'}
            color={ac === 'IO_OUTPUT' ? 'emerald' : 'slate'}
            isActive={ac === 'IO_OUTPUT'}
          />
          <HwBlock
            x={CPU_X + 270} y={ROW4_Y}
            width={90} height={BLK_H}
            label="I/O IN"
            sublabel={`A=${step.ioState.inputVal ?? '?'}`}
            color={ac === 'IO_INPUT' ? 'cyan' : 'slate'}
            isActive={ac === 'IO_INPUT'}
          />

          {/* ════ MEMORY CELLS ════ */}
          {step.memory.slice(0, 8).map((cell, i) => {
            const cy = 38 + i * 35;
            const isHit = cell.isAccessing;
            return (
              <g key={cell.address}>
                <rect
                  x={MEM_X} y={cy}
                  width={MEM_W - 10} height={28}
                  rx={6}
                  fill={isHit ? 'rgb(var(--card-surface))' : 'rgb(var(--card-bg))'}
                  stroke={isHit ? 'rgb(var(--accent-primary))' : 'rgb(var(--border-subtle))'}
                  strokeWidth={isHit ? 2 : 1}
                  className={isHit ? 'block-active' : ''}
                  style={{
                    transition: 'fill 0.25s, stroke 0.25s',
                  }}
                />
                <text
                  x={MEM_X + 10} y={cy + 15}
                  dominantBaseline="middle"
                  fill="rgb(var(--accent-primary))" fontSize={9}
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {`0x${cell.address.toString(16).toUpperCase().padStart(2, '0')}:`}
                </text>
                <text
                  x={MEM_X + 58} y={cy + 15}
                  dominantBaseline="middle"
                  fill={isHit ? 'rgb(var(--accent-emerald))' : 'rgb(var(--text-heading))'}
                  fontSize={9}
                  fontWeight={isHit ? '800' : '600'}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {cell.type === 'INSTRUCTION'
                    ? (cell.instructionText ?? '').slice(0, 22)
                    : `${cell.label ?? 'Data'}: ${cell.value}`}
                </text>
                <text
                  x={MEM_X + MEM_W - 18} y={cy + 15}
                  dominantBaseline="middle"
                  textAnchor="end"
                  fill={cell.type === 'INSTRUCTION' ? 'rgb(var(--accent-primary))' : 'rgb(var(--accent-amber))'}
                  fontSize={8}
                  fontWeight="800"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                >
                  {cell.type === 'INSTRUCTION' ? 'CODE' : 'DATA'}
                </text>
              </g>
            );
          })}

          {/* ════ INTERNAL CPU CONNECTIONS ════ */}
          <line x1={CPU_X + 75} y1={ROW1_Y + BLK_H} x2={CPU_X + 75} y2={ROW2_Y}
            stroke="rgb(var(--border-main))" strokeWidth={1.5} strokeDasharray="3 3" />
          <line x1={CPU_X + 215} y1={ROW1_Y + BLK_H} x2={CPU_X + 215} y2={ROW2_Y}
            stroke="rgb(var(--border-main))" strokeWidth={1.5} strokeDasharray="3 3" />
          <line x1={CPU_X + 75} y1={ROW2_Y + BLK_H} x2={CPU_X + 75} y2={ROW3_Y}
            stroke="rgb(var(--border-main))" strokeWidth={1.5} strokeDasharray="3 3" />
          <line x1={CPU_X + 215} y1={ROW3_Y + BLK_H} x2={CPU_X + 215} y2={ROW4_Y}
            stroke="rgb(var(--border-main))" strokeWidth={1.5} strokeDasharray="3 3" />

          {/* ════ SYSTEM BUSES ════ */}

          {/* ADDRESS BUS */}
          <text x={BUS_X_START} y={BUS_ADDR_Y - 6} fill="rgb(var(--accent-amber))" fontSize={9} fontWeight="800" letterSpacing={0.5}>
            ADDRESS BUS (16-bit)
          </text>
          <AnimatedWire
            x1={BUS_X_START} y1={BUS_ADDR_Y}
            x2={BUS_X_END} y2={BUS_ADDR_Y}
            type="address"
            active={bus === 'ADDRESS_BUS'}
            value={addrLabel}
            animKey={stepIndex + '_addr'}
            duration={800}
          />

          {/* DATA BUS */}
          <text x={BUS_X_START} y={BUS_DATA_Y - 6} fill="rgb(var(--accent-primary))" fontSize={9} fontWeight="800" letterSpacing={0.5}>
            DATA BUS (16-bit, bidirectional)
          </text>
          <AnimatedWire
            x1={BUS_X_START} y1={BUS_DATA_Y}
            x2={BUS_X_END} y2={BUS_DATA_Y}
            type="data"
            active={bus === 'DATA_BUS'}
            value={dataLabel}
            animKey={stepIndex + '_data'}
            duration={800}
          />

          {/* CONTROL BUS */}
          <text x={BUS_X_START} y={BUS_CTRL_Y - 6} fill="rgb(var(--accent-rose))" fontSize={9} fontWeight="800" letterSpacing={0.5}>
            CONTROL BUS (Signals)
          </text>
          <AnimatedWire
            x1={BUS_X_START} y1={BUS_CTRL_Y}
            x2={BUS_X_END} y2={BUS_CTRL_Y}
            type="control"
            active={bus === 'CONTROL_BUS'}
            value={ctrlLabel}
            animKey={stepIndex + '_ctrl'}
            duration={700}
            dir="h"
          />

          {/* Vertical tap from MAR down to Address Bus */}
          <line
            x1={CPU_X + 75} y1={ROW3_Y + BLK_H}
            x2={CPU_X + 75} y2={BUS_ADDR_Y}
            stroke={bus === 'ADDRESS_BUS' ? 'rgb(var(--accent-amber))' : 'rgb(var(--border-subtle))'}
            strokeWidth={bus === 'ADDRESS_BUS' ? 2 : 1}
            strokeDasharray={bus === 'ADDRESS_BUS' ? 'none' : '4 3'}
          />
          {/* Vertical tap from MDR down to Data Bus */}
          <line
            x1={CPU_X + 215} y1={ROW3_Y + BLK_H}
            x2={CPU_X + 215} y2={BUS_DATA_Y}
            stroke={bus === 'DATA_BUS' ? 'rgb(var(--accent-primary))' : 'rgb(var(--border-subtle))'}
            strokeWidth={bus === 'DATA_BUS' ? 2 : 1}
            strokeDasharray={bus === 'DATA_BUS' ? 'none' : '4 3'}
          />

          {/* Phase label */}
          <rect x={VB_W - 140} y={VB_H - 32} width={130} height={24} rx={6}
            fill={step.bottleneckActive ? 'rgb(var(--accent-amber))' : 'rgb(var(--card-bg))'}
            stroke={step.bottleneckActive ? 'rgb(var(--accent-amber))' : 'rgb(var(--accent-primary))'}
            strokeWidth={1.5}
          />
          <text
            x={VB_W - 75} y={VB_H - 16}
            textAnchor="middle" dominantBaseline="middle"
            fill={step.bottleneckActive ? '#000' : 'rgb(var(--text-heading))'}
            fontSize={10} fontWeight="800"
          >
            {step.phase}{step.bottleneckActive ? ' ⚠ BOTTLENECK' : ''}
          </text>
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
        <span>Active Bus: <strong className="text-cyan-700 dark:text-cyan-300 font-bold">{bus.replace(/_/g, ' ')}</strong></span>
        <span>Click any block for <strong className="text-indigo-700 dark:text-indigo-300 font-bold">X-Ray Gate Inspection</strong></span>
      </div>
    </div>
  );
};
