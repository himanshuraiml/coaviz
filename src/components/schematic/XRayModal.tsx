import React from 'react';
import { X, ZoomIn, Layers, Zap, Binary, ShieldAlert } from 'lucide-react';

export type XRayComponentType = 
  | 'ALU'
  | 'REGISTER_FILE'
  | 'CONTROL_UNIT'
  | 'PIPELINE_LATCH'
  | 'CACHE_TAG_COMPARATOR'
  | 'SRAM_CELL';

export interface XRayModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: XRayComponentType;
  title?: string;
  activeData?: {
    operandA?: number | string;
    operandB?: number | string;
    result?: number | string;
    operation?: string;
    controlWord?: string;
    flags?: { Z?: boolean; S?: boolean; C?: boolean; V?: boolean };
    tagInput?: string;
    storedTag?: string;
    isHit?: boolean;
    forwardingSource?: string;
  };
}

export const XRayModal: React.FC<XRayModalProps> = ({
  isOpen,
  onClose,
  componentType,
  title,
  activeData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="panel-card max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-2 border-cyan-500/40 rounded-3xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sub-panel !rounded-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <ZoomIn className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  X-Ray Hardware Cutaway
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Silicon / Gate-Level</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {title || getComponentTitle(componentType)}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl sub-panel border hover:border-cyan-500 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Schematic Cutaway */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {componentType === 'ALU' && <ALUCutaway data={activeData} />}
          {componentType === 'REGISTER_FILE' && <RegisterFileCutaway />}
          {componentType === 'CONTROL_UNIT' && <ControlUnitCutaway />}
          {componentType === 'PIPELINE_LATCH' && <PipelineLatchCutaway data={activeData} />}
          {componentType === 'CACHE_TAG_COMPARATOR' && <CacheComparatorCutaway data={activeData} />}
          {componentType === 'SRAM_CELL' && <SRAMCellCutaway />}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 sub-panel !rounded-none flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Cross-Section Engine active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-extrabold bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 transition-all shadow-md shadow-cyan-500/20 active:scale-95 text-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

function getComponentTitle(type: XRayComponentType): string {
  switch (type) {
    case 'ALU':
      return 'Arithmetic Logic Unit (ALU) Internal Cross-Section';
    case 'REGISTER_FILE':
      return 'D-Flip-Flop & Parallel Register Internal Latch Circuit';
    case 'CONTROL_UNIT':
      return 'Instruction Decoder & Sequence Control Matrix';
    case 'PIPELINE_LATCH':
      return 'Pipeline Stage Register & Hazard Forwarding Multiplexers';
    case 'CACHE_TAG_COMPARATOR':
      return 'Cache Tag Comparator & Hit/Miss Logic Gate Array';
    case 'SRAM_CELL':
      return '6T CMOS SRAM Memory Bitcell Cross-Section';
  }
}

// 1. ALU Cutaway
const ALUCutaway: React.FC<{ data?: XRayModalProps['activeData'] }> = ({ data }) => {
  const op = data?.operation || 'ADD';
  const opA = data?.operandA ?? '0x0015';
  const opB = data?.operandB ?? '0x002A';
  const res = data?.result ?? '0x003F';

  return (
    <div className="space-y-4">
      <div className="sub-panel p-4 border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase">
            Internal 16-Bit Parallel Datapath Stages
          </span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30">
            Active Mode: {op}
          </span>
        </div>

        {/* Interactive Schematic Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stage 1: Operand Inverters & Shifters */}
          <div className="sub-panel p-3.5 border flex flex-col gap-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Stage 1: Input Conditioning
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded-lg sub-panel border">
                <span className="text-slate-500">Bus A (AC):</span>
                <span className="ml-2 text-amber-700 dark:text-amber-300 font-black">{String(opA)}</span>
              </div>
              <div className="p-2 rounded-lg sub-panel border">
                <span className="text-slate-500">Bus B (DR/M):</span>
                <span className="ml-2 text-indigo-700 dark:text-indigo-300 font-black">{String(opB)}</span>
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 p-2 rounded sub-panel border font-sans">
                True/Complement buffer selects B or ~B based on subtract/add mode.
              </div>
            </div>
          </div>

          {/* Stage 2: Parallel Functional Units */}
          <div className="sub-panel p-3.5 border border-cyan-500/40 shadow-inner flex flex-col gap-2">
            <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Stage 2: Logic & Adder Array
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                op === 'ADD' || op === 'SUB'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                  : 'sub-panel border text-slate-500'
              }`}>
                <span>16b Full Adder Chain</span>
                <span className="text-[10px] font-bold">{op === 'ADD' ? 'ACTIVE' : 'IDLE'}</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                op === 'AND' || op === 'OR' || op === 'XOR'
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300'
                  : 'sub-panel border text-slate-500'
              }`}>
                <span>Bitwise Logic Gates</span>
                <span className="text-[10px] font-bold">{op === 'AND' ? 'ACTIVE' : 'IDLE'}</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                op === 'SHL' || op === 'SHR' || op === 'CIL' || op === 'CIR'
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300'
                  : 'sub-panel border text-slate-500'
              }`}>
                <span>Barrel Shifter Unit</span>
                <span className="text-[10px] font-bold">IDLE</span>
              </div>
            </div>
          </div>

          {/* Stage 3: Output MUX & Flag Generator */}
          <div className="sub-panel p-3.5 border flex flex-col gap-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Stage 3: Output MUX & Flags
            </div>
            <div className="p-2 rounded-lg sub-panel border text-xs font-mono">
              <div className="text-slate-500 mb-1">Result Output:</div>
              <div className="text-base font-black text-emerald-700 dark:text-emerald-400">{String(res)}</div>
            </div>
            {/* Status Flags */}
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
              <div className="p-1.5 rounded-lg sub-panel border">
                <div className="text-slate-500 font-bold">Z</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-black">{data?.flags?.Z ? '1' : '0'}</div>
              </div>
              <div className="p-1.5 rounded-lg sub-panel border">
                <div className="text-slate-500 font-bold">S</div>
                <div className="text-cyan-600 dark:text-cyan-400 font-black">{data?.flags?.S ? '1' : '0'}</div>
              </div>
              <div className="p-1.5 rounded-lg sub-panel border">
                <div className="text-slate-500 font-bold">C</div>
                <div className="text-amber-600 dark:text-amber-400 font-black">{data?.flags?.C ? '1' : '0'}</div>
              </div>
              <div className="p-1.5 rounded-lg sub-panel border">
                <div className="text-slate-500 font-bold">V</div>
                <div className="text-rose-600 dark:text-rose-400 font-black">{data?.flags?.V ? '1' : '0'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Register File Cutaway
const RegisterFileCutaway: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="sub-panel p-4 border text-slate-800 dark:text-slate-200">
        <h4 className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase mb-3">
          Edge-Triggered D-Flip-Flop Register Bitcell Architecture
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl sub-panel border font-mono text-xs space-y-3">
            <div className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Master-Slave Latching Mechanism
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans leading-relaxed">
              When CLK=0, the Master latch captures the input data D while the Slave latch is locked. 
              On the rising edge of CLK, the Master isolates and transfers state to the Slave, driving the stable output Q.
            </p>
            <div className="p-2.5 rounded-lg sub-panel border text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Load Enable (LD):</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">HIGH (Gated)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Output Enable (OE):</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-bold">ACTIVE (Tri-State Driver)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl sub-panel border flex items-center justify-center">
            <svg viewBox="0 0 320 160" className="w-full h-auto">
              <rect x="20" y="20" width="110" height="120" rx="8" fill="var(--card-bg)" stroke="var(--border-main)" strokeWidth="2" />
              <text x="75" y="45" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--text-heading)">Master Latch</text>
              <text x="35" y="85" fontSize="10" fontFamily="monospace" fill="var(--accent-primary)">D In</text>

              <line x1="130" y1="80" x2="190" y2="80" stroke="var(--accent-primary)" strokeWidth="2" />

              <rect x="190" y="20" width="110" height="120" rx="8" fill="var(--card-bg)" stroke="var(--border-main)" strokeWidth="2" />
              <text x="245" y="45" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--text-heading)">Slave Latch</text>
              <text x="280" y="85" fontSize="10" fontFamily="monospace" fill="var(--accent-emerald)">Q Out</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Control Unit Cutaway
const ControlUnitCutaway: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="sub-panel p-4 border text-slate-800 dark:text-slate-200">
        <h4 className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase mb-3">
          Hardwired PLA Decoder Matrix & Micro-Sequencer
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl sub-panel border space-y-2">
            <span className="text-slate-500 font-bold">1. Opcode Decoder</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
              3-to-8 line decoder transforms the 3-bit Opcode field into active micro-operation select lines ($q_0..q_7$).
            </p>
          </div>
          <div className="p-3.5 rounded-xl sub-panel border space-y-2">
            <span className="text-slate-500 font-bold">2. Timing Step Counter</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
              4-bit binary sequence counter driven by CLK pulses generates consecutive clock periods $T_0, T_1, T_2..T_{15}$.
            </p>
          </div>
          <div className="p-3.5 rounded-xl sub-panel border space-y-2">
            <span className="text-slate-500 font-bold">3. Control Logic Matrix</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
              AND-OR combinational gate network synthesizes active load signals: LD(MAR) = T₀ + q₃·T₄.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Pipeline Latch Cutaway
const PipelineLatchCutaway: React.FC<{ data?: XRayModalProps['activeData'] }> = ({ data }) => {
  return (
    <div className="space-y-4">
      <div className="sub-panel p-4 border text-slate-800 dark:text-slate-200">
        <h4 className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase mb-3">
          Pipeline Inter-Stage Buffer & Forwarding Hazard Multiplexers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl sub-panel border space-y-2">
            <div className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              EX-EX & MEM-EX Forwarding Multiplexer
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans leading-relaxed">
              Detects RAW (Read-After-Write) register hazards and routes result data directly to ALU input without stalling.
            </p>
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
              Forwarding Path: {data?.forwardingSource || 'ALU Result Forwarded to Next Instruction'}
            </div>
          </div>
          <div className="p-3.5 rounded-xl sub-panel border space-y-2">
            <div className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Hazard Detection & Stall Insertion
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans leading-relaxed">
              If a Load-Use data dependency occurs, the Hazard Unit suppresses IF/ID latch updates and injects NOP bubbles into ID/EX.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Cache Comparator Cutaway
const CacheComparatorCutaway: React.FC<{ data?: XRayModalProps['activeData'] }> = ({ data }) => {
  const tagIn = data?.tagInput || '0x01A';
  const tagStored = data?.storedTag || '0x01A';
  const isHit = data?.isHit ?? true;

  return (
    <div className="space-y-4">
      <div className="sub-panel p-4 border text-slate-800 dark:text-slate-200">
        <h4 className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase mb-3">
          SRAM Tag Array & High-Speed XOR Bit Comparator
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl sub-panel border space-y-2">
            <div className="flex justify-between items-center p-2 rounded sub-panel border">
              <span className="text-slate-500">Address Tag Field:</span>
              <span className="text-cyan-700 dark:text-cyan-300 font-bold">{tagIn}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded sub-panel border">
              <span className="text-slate-500">SRAM Stored Tag:</span>
              <span className="text-indigo-700 dark:text-indigo-300 font-bold">{tagStored}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded sub-panel border">
              <span className="text-slate-500">Valid Bit (V):</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">1 (Valid)</span>
            </div>
          </div>
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 ${
            isHit
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300'
          }`}>
            <div className="text-2xl font-black">{isHit ? 'HIT (1)' : 'MISS (0)'}</div>
            <div className="text-[11px] font-sans text-center">
              {isHit ? 'Tag Match Confirmed: 0ns Staged Bus Delivery' : 'Tag Mismatch: Memory Subsystem Latency Incurred'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 6. SRAM Cell Cutaway
const SRAMCellCutaway: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="sub-panel p-4 border text-slate-800 dark:text-slate-200">
        <h4 className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase mb-3">
          6-Transistor (6T) CMOS Static RAM Memory Bitcell
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl sub-panel border font-sans space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Cross-Coupled CMOS Inverter Pair
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Two cross-coupled NOT gates (M₁/M₂ and M₃/M₄) form a bistable flip-flop latch storing a single bit in complementary states (Q and Q').
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Two access NMOS transistors (M₅/M₆) connect the storage nodes to complementary Bit Lines (BL and BL') when Word Line (WL) is asserted HIGH.
            </p>
          </div>
          <div className="p-4 rounded-xl sub-panel border flex items-center justify-center">
            <svg viewBox="0 0 240 140" className="w-full h-auto">
              <rect x="20" y="30" width="80" height="80" rx="8" fill="var(--card-bg)" stroke="var(--border-main)" strokeWidth="2" />
              <text x="60" y="75" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--text-heading)">INV 1 (Q)</text>

              <rect x="140" y="30" width="80" height="80" rx="8" fill="var(--card-bg)" stroke="var(--border-main)" strokeWidth="2" />
              <text x="180" y="75" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--text-heading)">INV 2 (~Q)</text>

              <path d="M 100 50 L 140 50" stroke="var(--accent-primary)" strokeWidth="2" markerEnd="url(#arrow)" />
              <path d="M 140 90 L 100 90" stroke="var(--accent-secondary)" strokeWidth="2" markerEnd="url(#arrow)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
