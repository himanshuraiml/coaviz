import React, { useState, useMemo } from 'react';
import { 
  convertNumberSystems, 
  generateComplementSteps, 
  computeRadixComplements, 
  NumberSystemState 
} from '../../../engines/arithmetic/numberSystems.ts';
import { Binary, Sparkles, Hash } from 'lucide-react';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';

export const NumberSystemSandbox: React.FC = () => {
  const [decimalVal, setDecimalVal] = useState<number>(-42);
  const [bitWidth, setBitWidth] = useState<number>(8);
  const [activeComplementBase, setActiveComplementBase] = useState<number>(10);
  const [baseInputNumber, setBaseInputNumber] = useState<string>('4250');

  const state: NumberSystemState = useMemo(() => {
    return convertNumberSystems(decimalVal, bitWidth);
  }, [decimalVal, bitWidth]);

  const complementSteps = useMemo(() => {
    return generateComplementSteps(decimalVal, bitWidth);
  }, [decimalVal, bitWidth]);

  const radixComp = useMemo(() => {
    return computeRadixComplements(baseInputNumber, activeComplementBase, baseInputNumber.length || 4);
  }, [baseInputNumber, activeComplementBase]);

  const presets = [
    { label: '+42', val: 42 },
    { label: '-42', val: -42 },
    { label: '+127 (Max 8b)', val: 127 },
    { label: '-128 (Min 8b)', val: -128 },
    { label: '-1', val: -1 },
    { label: '0', val: 0 },
    { label: '+255 (Unsigned)', val: 255 },
  ];

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto">
      {/* Configuration & Quick Presets */}
      <div className="panel-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setDecimalVal(p.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                decimalVal === p.val
                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm font-black'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-xs'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 sub-panel px-3 py-1.5 border">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Decimal Input:</label>
            <input
              type="number"
              value={decimalVal}
              onChange={(e) => setDecimalVal(parseInt(e.target.value) || 0)}
              className="w-20 input-box px-2 py-0.5 text-xs text-cyan-700 dark:text-cyan-300 text-center font-bold"
            />
          </div>

          <div className="flex items-center gap-2 sub-panel px-3 py-1.5 border">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Bits:</label>
            <select
              value={bitWidth}
              onChange={(e) => setBitWidth(parseInt(e.target.value))}
              className="input-box px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value={8}>8-Bit (Byte)</option>
              <option value={16}>16-Bit (Word)</option>
              <option value={32}>32-Bit (DWord)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4-Way Radix Synchronized Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Binary */}
        <div className="panel-card p-4 border border-cyan-500/30 bg-cyan-500/5 shadow-md">
          <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1 flex items-center justify-between">
            <span>Binary (Radix 2)</span>
            <span className="text-[10px] bg-cyan-500/15 px-1.5 py-0.5 rounded font-mono font-bold text-cyan-700 dark:text-cyan-300">Base 2</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-cyan-800 dark:text-cyan-200 tracking-widest my-1 truncate">
            {state.binary}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Prefix: <span className="text-cyan-700 dark:text-cyan-400 font-bold">0b</span>{state.binary}
          </div>
        </div>

        {/* Octal */}
        <div className="panel-card p-4 border border-amber-500/30 bg-amber-500/5 shadow-md">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center justify-between">
            <span>Octal (Radix 8)</span>
            <span className="text-[10px] bg-amber-500/15 px-1.5 py-0.5 rounded font-mono font-bold text-amber-700 dark:text-amber-300">Base 8</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200 tracking-wider my-1 truncate">
            {state.octal}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Prefix: <span className="text-amber-700 dark:text-amber-400 font-bold">0o</span>{state.octal}
          </div>
        </div>

        {/* Decimal */}
        <div className="panel-card p-4 border border-emerald-500/30 bg-emerald-500/5 shadow-md">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between">
            <span>Decimal (Radix 10)</span>
            <span className="text-[10px] bg-emerald-500/15 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700 dark:text-emerald-300">Base 10</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200 tracking-wider my-1 truncate">
            {state.decimal}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Unsigned: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{state.unsignedValue}</span>
          </div>
        </div>

        {/* Hexadecimal */}
        <div className="panel-card p-4 border border-indigo-500/30 bg-indigo-500/5 shadow-md">
          <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center justify-between">
            <span>Hexadecimal (Radix 16)</span>
            <span className="text-[10px] bg-indigo-500/15 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700 dark:text-indigo-300">Base 16</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-indigo-800 dark:text-indigo-200 tracking-wider my-1 truncate">
            {state.hexadecimal}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Prefix: <span className="text-indigo-700 dark:text-indigo-400 font-bold">0x</span>{state.hexadecimal}
          </div>
        </div>
      </div>

      {/* Signed Number Representations: Signed Magnitude, 1's Comp, 2's Comp */}
      <div className="panel-card p-4 shadow-xl">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Binary className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          {bitWidth}-Bit Signed & Unsigned Representation Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="sub-panel p-3.5 border">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Signed-Magnitude (SM)</div>
            <div className="font-mono text-lg font-black text-rose-700 dark:text-rose-300 tracking-wider my-1">
              {state.signedMagnitude}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Sign bit: <span className="text-rose-700 dark:text-rose-400 font-bold">{state.signedMagnitude[0]}</span> | Mag: {state.signedMagnitude.slice(1)}
            </div>
          </div>

          <div className="sub-panel p-3.5 border">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">1's Complement (Diminished Radix)</div>
            <div className="font-mono text-lg font-black text-amber-700 dark:text-amber-300 tracking-wider my-1">
              {state.onesComplement}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Inverted bit-by-bit from magnitude
            </div>
          </div>

          <div className="sub-panel p-3.5 border border-cyan-500/40 bg-cyan-500/5">
            <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1">2's Complement (Standard Hardware)</div>
            <div className="font-mono text-lg font-black text-cyan-800 dark:text-cyan-200 tracking-wider my-1">
              {state.twosComplement}
            </div>
            <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-bold">
              1's Complement + 1 (No negative zero anomaly)
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step complement derivation */}
      <ExplanationCard
        title={`2's Complement Derivation for ${decimalVal}`}
        badge={`${bitWidth}-Bit 2's Complement`}
        badgeColor={state.isNegative ? 'rose' : 'emerald'}
        actionTaken={`Result = ${state.twosComplement}₂ (Decimal signed value = ${state.signedValue})`}
        explanation="In digital computer arithmetic, 2's complement is universally used because addition and subtraction can be handled by identical ALU hardware with zero special-case logic for +0 and -0."
        subNotes={complementSteps.steps}
      />

      {/* Generalized r's and (r-1)'s Complement Interactive Lab */}
      <div className="panel-card p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Generalized Radix (r's) & Diminished Radix ((r-1)'s) Calculator
          </h3>

          <div className="flex items-center gap-1.5 sub-panel p-1 border">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold px-1">Base (r):</span>
            {[2, 8, 10, 16].map((r) => (
              <button
                key={r}
                onClick={() => setActiveComplementBase(r)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeComplementBase === r
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Base-{r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="sub-panel p-3.5 border">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Input Number (Base {activeComplementBase}):</label>
            <input
              type="text"
              value={baseInputNumber}
              onChange={(e) => setBaseInputNumber(e.target.value.toUpperCase())}
              className="w-full input-box px-2.5 py-1 text-sm font-bold text-cyan-700 dark:text-cyan-300"
            />
          </div>

          <div className="sub-panel p-3.5 border">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">{radixComp.diminishedRadixName}</div>
            <div className="font-mono text-xl font-black text-amber-800 dark:text-amber-300 my-1">
              {radixComp.diminishedComplement}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Formula: (r^n - 1) - N
            </div>
          </div>

          <div className="sub-panel p-3.5 border border-cyan-500/40 bg-cyan-500/5">
            <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1">{radixComp.radixName}</div>
            <div className="font-mono text-xl font-black text-cyan-800 dark:text-cyan-200 my-1">
              {radixComp.radixComplement}
            </div>
            <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold">
              Formula: (r^n - N) = (r-1)'s comp + 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
