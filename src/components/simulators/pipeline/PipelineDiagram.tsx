import React from 'react';
import { PipelineCycleState, Instruction, PipelineSimulationResult } from '../../../engines/cpu/pipeline.ts';
import { HwBlock, BlockColor } from '../../schematic/SvgDiagram/HwBlock.tsx';
import { AnimatedWire } from '../../schematic/SvgDiagram/AnimatedWire.tsx';

interface PipelineDiagramProps {
  cycleState: PipelineCycleState;
  cycleIndex: number;
  simResult: PipelineSimulationResult;
  onClickStage?: (stage: string) => void;
}

// Layout (viewBox 960 × 320)
const VB_W = 960;
const VB_H = 320;

const STAGE_W = 130;
const STAGE_H = 90;
const LATCH_W = 16;
const LATCH_H = 70;
const STAGE_Y = 80;
const TOKEN_H = 28;

// X positions for each stage box
const STAGES = [
  { id: 'IF',  label: 'IF',  sublabel: 'Instruction\nFetch', color: 'cyan'   as BlockColor, x: 30 },
  { id: 'ID',  label: 'ID',  sublabel: 'Decode &\nReg Read', color: 'indigo' as BlockColor, x: 220 },
  { id: 'EX',  label: 'EX',  sublabel: 'ALU /\nExecute',    color: 'amber'  as BlockColor, x: 410 },
  { id: 'MEM', label: 'MEM', sublabel: 'D-Cache\nMemory',   color: 'emerald' as BlockColor, x: 600 },
  { id: 'WB',  label: 'WB',  sublabel: 'Write\nBack',       color: 'purple' as BlockColor, x: 790 },
];

const LATCH_LABELS = ['IF/ID', 'ID/EX', 'EX/MEM', 'MEM/WB'];

const STAGE_COLORS: Record<string, { bg: string; stroke: string; text: string }> = {
  IF:    { bg: '#e0f2fe', stroke: '#0ea5e9', text: '#0369a1' },
  ID:    { bg: '#e0e7ff', stroke: '#6366f1', text: '#4338ca' },
  EX:    { bg: '#fef3c7', stroke: '#f59e0b', text: '#b45309' },
  MEM:   { bg: '#d1fae5', stroke: '#10b981', text: '#065f46' },
  WB:    { bg: '#ede9fe', stroke: '#a855f7', text: '#6b21a8' },
  STALL: { bg: '#ffe4e6', stroke: '#f43f5e', text: '#9f1239' },
  FLUSH: { bg: '#f1f5f9', stroke: '#94a3b8', text: '#94a3b8' },
};

export const PipelineDiagram: React.FC<PipelineDiagramProps> = ({
  cycleState, cycleIndex, simResult, onClickStage,
}) => {
  // Map stage id → current instruction in that slot
  const stageInst: Record<string, Instruction | null | 'STALL' | 'FLUSH'> = {
    IF:  cycleState.IF,
    ID:  cycleState.ID,
    EX:  cycleState.EX,
    MEM: cycleState.MEM,
    WB:  cycleState.WB,
  };

  // Check for stall/flush from hazard slots in this cycle
  const hazardMap: Record<string, 'STALL' | 'FLUSH'> = {};
  Object.entries(cycleState.instructionStages).forEach(([, slot]) => {
    if (!slot) return;
    if (slot.stage === 'STALL') hazardMap[slot.stage] = 'STALL';
    if (slot.stage === 'FLUSH') hazardMap[slot.stage] = 'FLUSH';
  });

  // Forwarding bypass arc — from EX/MEM back to EX input
  const hasForwarding = cycleState.forwardingEvents.length > 0;

  return (
    <div className="diagram-panel w-full overflow-x-auto">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            5-Stage RISC Pipeline — Cycle {cycleState.cycle} of {simResult.totalCycles}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 border border-cyan-200">CPI: {simResult.cpi}</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">Speedup: {simResult.speedup}×</span>
          {hasForwarding && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">⚡ Forwarding Active</span>
          )}
          {cycleState.hazards.length > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">⚠ Hazard</span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ minWidth: 600, maxHeight: 340 }}
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        {/* ── Pipeline PC clock label ── */}
        <text x={20} y={40} fill="#64748b" fontSize={10} fontWeight="600">
          Cycle {cycleState.cycle} →
        </text>

        {/* ── Stage boxes ── */}
        {STAGES.map((stage) => {
          const inst = stageInst[stage.id];
          const isActive = inst !== null;
          return (
            <g key={stage.id}>
              <HwBlock
                x={stage.x} y={STAGE_Y}
                width={STAGE_W} height={STAGE_H}
                label={stage.label}
                sublabel={stage.sublabel}
                color={stage.color}
                isActive={isActive}
                onClick={() => onClickStage?.(stage.id)}
              />
              {/* Instruction token inside stage */}
              {inst && inst !== 'STALL' && inst !== 'FLUSH' && (
                <g
                  key={`${stage.id}_${cycleIndex}`}
                  className="anim-stage-slide"
                  style={{ animationDuration: '0.5s' }}
                >
                  <rect
                    x={stage.x + 6} y={STAGE_Y + STAGE_H - TOKEN_H - 8}
                    width={STAGE_W - 12} height={TOKEN_H}
                    rx={5}
                    fill={STAGE_COLORS[stage.id]?.bg || '#f1f5f9'}
                    stroke={STAGE_COLORS[stage.id]?.stroke || '#94a3b8'}
                    strokeWidth={1.5}
                  />
                  <text
                    x={stage.x + STAGE_W / 2}
                    y={STAGE_Y + STAGE_H - TOKEN_H / 2 - 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={STAGE_COLORS[stage.id]?.text || '#64748b'}
                    fontSize={9}
                    fontWeight="700"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {inst.rawText.slice(0, 18)}
                  </text>
                </g>
              )}
              {/* Stall bubble */}
              {(hazardMap['STALL'] && stage.id === 'EX' && cycleState.hazards.some(h => h.resolvedBy === 'STALL')) && (
                <g>
                  <rect
                    x={stage.x + 6} y={STAGE_Y + STAGE_H - TOKEN_H - 8}
                    width={STAGE_W - 12} height={TOKEN_H}
                    rx={5}
                    fill="#ffe4e6" stroke="#f43f5e" strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                  <text
                    x={stage.x + STAGE_W / 2}
                    y={STAGE_Y + STAGE_H - TOKEN_H / 2 - 8}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#e11d48" fontSize={10} fontWeight="800"
                  >
                    NOP / BUBBLE
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ── Inter-stage latches ── */}
        {STAGES.slice(0, 4).map((stage, i) => {
          const nextStage = STAGES[i + 1];
          const latchX = stage.x + STAGE_W + (nextStage.x - stage.x - STAGE_W) / 2 - LATCH_W / 2;
          const latchY = STAGE_Y + (STAGE_H - LATCH_H) / 2;
          const isActive = stageInst[stage.id] !== null || stageInst[nextStage.id] !== null;
          return (
            <g key={`latch_${i}`}>
              <rect
                x={latchX} y={latchY}
                width={LATCH_W} height={LATCH_H}
                rx={3}
                fill={isActive ? '#dbeafe' : '#f1f5f9'}
                stroke={isActive ? '#3b82f6' : '#cbd5e1'}
                strokeWidth={1.5}
              />
              <text
                x={latchX + LATCH_W / 2}
                y={latchY + LATCH_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? '#1d4ed8' : '#94a3b8'}
                fontSize={7.5}
                fontWeight="700"
                transform={`rotate(-90, ${latchX + LATCH_W / 2}, ${latchY + LATCH_H / 2})`}
              >
                {LATCH_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* ── Wires between stages (horizontal connector lines) ── */}
        {STAGES.slice(0, 4).map((stage, i) => {
          const nextStage = STAGES[i + 1];
          const wireY = STAGE_Y + STAGE_H / 2;
          const isActive = stageInst[stage.id] !== null && stageInst[nextStage.id] !== null;
          return (
            <AnimatedWire
              key={`wire_${i}`}
              x1={stage.x + STAGE_W} y1={wireY}
              x2={nextStage.x} y2={wireY}
              type="data"
              active={isActive}
              animKey={`${cycleIndex}_wire_${i}`}
              duration={600}
            />
          );
        })}

        {/* ── Forwarding bypass arc (EX/MEM → EX input) ── */}
        {hasForwarding && (
          <g>
            <path
              d={`M ${STAGES[2].x + STAGE_W / 2} ${STAGE_Y + STAGE_H}
                  Q ${STAGES[2].x + STAGE_W / 2} ${STAGE_Y + STAGE_H + 70}
                    ${STAGES[1].x + STAGE_W / 2} ${STAGE_Y + STAGE_H}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 3"
            />
            <polygon
              points="0,-5 8,0 0,5"
              fill="#f59e0b"
              transform={`translate(${STAGES[1].x + STAGE_W / 2},${STAGE_Y + STAGE_H}) rotate(90)`}
            />
            <text
              x={(STAGES[1].x + STAGES[2].x + STAGE_W) / 2}
              y={STAGE_Y + STAGE_H + 62}
              textAnchor="middle"
              fill="#b45309"
              fontSize={8.5}
              fontWeight="700"
            >
              ⚡ Data Forwarding Bypass
            </text>
            {cycleState.forwardingEvents.map((ev, i) => (
              <text
                key={i}
                x={(STAGES[1].x + STAGES[2].x + STAGE_W) / 2}
                y={STAGE_Y + STAGE_H + 76 + i * 10}
                textAnchor="middle"
                fill="#92400e"
                fontSize={8}
                fontFamily="'JetBrains Mono', monospace"
              >
                {ev.slice(0, 40)}
              </text>
            ))}
          </g>
        )}

        {/* ── Hazard alerts below stages ── */}
        {cycleState.hazards.map((hz, i) => (
          <g key={i}>
            <rect
              x={30} y={VB_H - 42 - i * 26}
              width={VB_W - 60} height={22}
              rx={6}
              fill="#fff1f2" stroke="#f43f5e" strokeWidth={1.5}
            />
            <text
              x={50} y={VB_H - 26 - i * 26}
              dominantBaseline="middle"
              fill="#e11d48" fontSize={9} fontWeight="700"
            >
              ⚠ {hz.type} Hazard: {hz.description.slice(0, 100)}
            </text>
          </g>
        ))}

        {/* ── Stage labels below boxes ── */}
        {STAGES.map((stage) => (
          <text
            key={`label_${stage.id}`}
            x={stage.x + STAGE_W / 2}
            y={STAGE_Y + STAGE_H + 18}
            textAnchor="middle"
            fill={STAGE_COLORS[stage.id]?.stroke || '#64748b'}
            fontSize={9}
            fontWeight="700"
          >
            {stage.id === 'IF' ? 'I-Cache' :
             stage.id === 'ID' ? 'RegFile' :
             stage.id === 'EX' ? 'ALU + MUX' :
             stage.id === 'MEM' ? 'D-Cache' : 'Reg Write'}
          </text>
        ))}
      </svg>
    </div>
  );
};
