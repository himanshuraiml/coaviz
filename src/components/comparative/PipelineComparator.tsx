import React, { useMemo } from 'react';
import { 
  simulatePipeline, 
  Instruction, 
  PipelineSimulationResult 
} from '../../engines/cpu/pipeline.ts';
import { SplitSquareVertical, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PipelineComparatorProps {
  instructions: Instruction[];
}

export const PipelineComparator: React.FC<PipelineComparatorProps> = ({ instructions }) => {
  // With Data Forwarding (Bypass)
  const withForwardingRes: PipelineSimulationResult = useMemo(() => {
    return simulatePipeline(instructions, {
      enableForwarding: true,
      branchPrediction: 'NOT_TAKEN',
      branchOutcomeTaken: false,
    });
  }, [instructions]);

  // Without Forwarding (Stalls / Bubbles)
  const withoutForwardingRes: PipelineSimulationResult = useMemo(() => {
    return simulatePipeline(instructions, {
      enableForwarding: false,
      branchPrediction: 'NOT_TAKEN',
      branchOutcomeTaken: false,
    });
  }, [instructions]);

  const cycleSaved = withoutForwardingRes.totalCycles - withForwardingRes.totalCycles;

  return (
    <div className="flex flex-col gap-4 p-4 bg-card-bg border border-border-main rounded-2xl shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-main pb-3">
        <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
          <SplitSquareVertical className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-text-heading">
            Side-by-Side Pipeline Hazard Comparator: Data Forwarding vs Hardware Stalls
          </h3>
          <p className="text-xs text-text-muted">
            Analyzing {instructions.length} instructions across 5 stages (IF, ID, EX, MEM, WB)
          </p>
        </div>
      </div>

      {/* Dual Comparative Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: With Forwarding */}
        <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-emerald" />
              <h4 className="text-xs font-black text-text-heading uppercase tracking-wider">
                With Data Forwarding (Bypass Unit)
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-emerald/15 text-accent-emerald">
              Optimal Flow
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Total Cycles</span>
              <span className="text-base font-black text-accent-emerald">{withForwardingRes.totalCycles}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">CPI</span>
              <span className="text-base font-black text-accent-primary">{withForwardingRes.cpi}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Speedup</span>
              <span className="text-base font-black text-text-heading">{withForwardingRes.speedup}x</span>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-border-main/50 text-[11px] text-text-muted">
            <strong>Forwarding Advantage:</strong> ALU outputs are routed directly from EX/MEM or MEM/WB pipeline registers to subsequent instruction ALU inputs, eliminating RAW data hazard bubbles.
          </div>
        </div>

        {/* Right: Without Forwarding */}
        <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-accent-rose" />
              <h4 className="text-xs font-black text-text-heading uppercase tracking-wider">
                Without Forwarding (Bubble Stalls)
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-rose/15 text-accent-rose">
              Stall Penalty
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Total Cycles</span>
              <span className="text-base font-black text-accent-rose">{withoutForwardingRes.totalCycles}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">CPI</span>
              <span className="text-base font-black text-accent-rose">{withoutForwardingRes.cpi}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Speedup</span>
              <span className="text-base font-black text-text-muted">{withoutForwardingRes.speedup}x</span>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-border-main/50 text-[11px] text-text-muted">
            <strong>Stall Penalty:</strong> Must freeze IF & ID stages and insert NOP (bubble) stages until the producer instruction completes WB stage to write to the physical register file.
          </div>
        </div>
      </div>

      {/* Summary Impact Banner */}
      <div className="p-3.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
          <span className="text-text-heading font-bold">
            Hardware Optimization Benefit: Forwarding saves {cycleSaved} clock cycles ({((cycleSaved / (withoutForwardingRes.totalCycles || 1)) * 100).toFixed(0)}% execution latency reduction)
          </span>
        </div>
      </div>
    </div>
  );
};
