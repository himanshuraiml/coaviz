import React, { useMemo } from 'react';
import { 
  PrecisionMode, 
  IEEE754Decomposition, 
  floatToSingleIEEE754, 
  floatToDoubleIEEE754, 
  parseIEEE754Bits 
} from '../../../engines/arithmetic/ieee754.ts';
import { Sparkles, Binary } from 'lucide-react';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const IEEE754Simulator: React.FC = () => {
  const [precision, setPrecision] = usePersistentState<PrecisionMode>('ieee_prec', 'single');
  const [decimalInput, setDecimalInput] = usePersistentState<string>('ieee_input', '13.625');
  const [bits, setBits] = usePersistentState<string>('ieee_bits', floatToSingleIEEE754(13.625).fullBinary);

  const isSingle = precision === 'single';
  const expLength = isSingle ? 8 : 11;
  const manLength = isSingle ? 23 : 52;
  const bias = isSingle ? 127 : 1023;

  // Sync from bit string
  const decomposition: IEEE754Decomposition = useMemo(() => {
    const s = bits[0] || '0';
    const e = bits.slice(1, 1 + expLength).padEnd(expLength, '0');
    const m = bits.slice(1 + expLength).padEnd(manLength, '0');
    return parseIEEE754Bits(s, e, m, precision);
  }, [bits, precision, expLength, manLength]);

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    return {
      title: `IEEE-754 Floating Point Representation (${isSingle ? '32-bit Single' : '64-bit Double'})`,
      subtitle: `Decomposition of Decimal Value: ${decomposition.decimalValue}`,
      parameters: {
        'Precision': isSingle ? 'Single (32-bit)' : 'Double (64-bit)',
        'Input String': decimalInput,
        'Decimal Output': decomposition.decimalValue,
        'Hexadecimal': decomposition.hexString,
        'Classification': decomposition.classification,
      },
      columns: [
        { key: 'field', header: 'Field Component' },
        { key: 'bits', header: 'Bit Pattern' },
        { key: 'raw', header: 'Raw Value' },
        { key: 'interpreted', header: 'Interpreted Value' },
      ],
      rows: [
        {
          field: 'Sign (S)',
          bits: decomposition.signBit,
          raw: decomposition.signBit,
          interpreted: decomposition.signDecimal > 0 ? '+1 (Positive)' : '-1 (Negative)',
        },
        {
          field: `Biased Exponent (E)`,
          bits: decomposition.exponentBits,
          raw: decomposition.exponentRaw,
          interpreted: `Unbiased = ${decomposition.exponentRaw} - ${bias} = ${decomposition.exponentUnbiased}`,
        },
        {
          field: `Mantissa / Fraction (M)`,
          bits: decomposition.mantissaBits,
          raw: decomposition.mantissaFraction.toFixed(7),
          interpreted: `${decomposition.implicitBit}.${decomposition.mantissaBits} (Fraction = ${decomposition.mantissaFraction})`,
        },
        {
          field: 'Complete Word',
          bits: decomposition.fullBinary,
          raw: decomposition.hexString,
          interpreted: decomposition.formulaDisplay,
        },
      ],
      conclusion: `Final Computed Value = ${decomposition.decimalValue} (${decomposition.classification})`,
    };
  }, [isSingle, decimalInput, decomposition, bias]);

  // Handle direct decimal input change
  const handleDecimalChange = (valStr: string) => {
    setDecimalInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      const decomp = isSingle ? floatToSingleIEEE754(num) : floatToDoubleIEEE754(num);
      setBits(decomp.fullBinary);
    }
  };

  // Toggle individual bit
  const handleToggleBit = (index: number) => {
    const bitArr = bits.split('');
    bitArr[index] = bitArr[index] === '1' ? '0' : '1';
    const newBits = bitArr.join('');
    setBits(newBits);

    // Update decimal input display
    const s = newBits[0];
    const e = newBits.slice(1, 1 + expLength);
    const m = newBits.slice(1 + expLength);
    const decomp = parseIEEE754Bits(s, e, m, precision);
    setDecimalInput(decomp.decimalValue.toString());
  };

  // Presets
  const presets = [
    { label: '+0.0', val: 0 },
    { label: '-0.0', bits: '1' + '0'.repeat(isSingle ? 31 : 63) },
    { label: '1.0', val: 1.0 },
    { label: '-1.0', val: -1.0 },
    { label: '13.625', val: 13.625 },
    { label: '0.15625 (1/8 + 1/32)', val: 0.15625 },
    { label: 'π (3.14159)', val: Math.PI },
    { label: '+Infinity', bits: '0' + '1'.repeat(expLength) + '0'.repeat(manLength) },
    { label: '-Infinity', bits: '1' + '1'.repeat(expLength) + '0'.repeat(manLength) },
    { label: 'NaN', bits: '0' + '1'.repeat(expLength) + '1' + '0'.repeat(manLength - 1) },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    if (p.val !== undefined) {
      setDecimalInput(p.val.toString());
      const decomp = isSingle ? floatToSingleIEEE754(p.val) : floatToDoubleIEEE754(p.val);
      setBits(decomp.fullBinary);
    } else if (p.bits) {
      setBits(p.bits);
      const s = p.bits[0];
      const e = p.bits.slice(1, 1 + expLength);
      const m = p.bits.slice(1 + expLength);
      const decomp = parseIEEE754Bits(s, e, m, precision);
      setDecimalInput(decomp.decimalValue.toString());
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* Control & Precision Selector Header */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Precision Toggle */}
        <div className="flex items-center gap-1.5 bg-card-surface p-1 rounded-xl border border-border-main">
          <button
            onClick={() => {
              setPrecision('single');
              const num = parseFloat(decimalInput) || 13.625;
              setBits(floatToSingleIEEE754(num).fullBinary);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              isSingle
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-heading hover:bg-card-subtle'
            }`}
          >
            Single Precision (32-bit)
          </button>
          <button
            onClick={() => {
              setPrecision('double');
              const num = parseFloat(decimalInput) || 13.625;
              setBits(floatToDoubleIEEE754(num).fullBinary);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              !isSingle
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-heading hover:bg-card-subtle'
            }`}
          >
            Double Precision (64-bit)
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-card-surface border border-border-main hover:border-accent-primary text-text-body transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Export Menu */}
        <ExportMenu data={exportData} filenamePrefix={`ieee754-${precision}`} />
      </div>

      {/* Decimal Input Bar */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
          <label className="text-xs font-bold text-text-muted">Decimal Value:</label>
          <input
            type="text"
            value={decimalInput}
            onChange={(e) => handleDecimalChange(e.target.value)}
            className="w-32 bg-card-bg border border-border-main rounded-lg px-2 py-0.5 text-sm text-accent-primary text-center font-bold focus:outline-none focus:border-accent-primary"
          />
        </div>

        <div className="text-xs font-mono font-bold text-text-muted">
          Hex Word: <span className="text-text-heading font-extrabold">{decomposition.hexString}</span>
        </div>
      </div>

      {/* Floating Point Value Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-text-muted mb-1">Calculated Value</div>
          <div className="font-mono text-xl sm:text-2xl font-black text-accent-primary truncate my-1">
            {decomposition.decimalValue.toString()}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Hex: <span className="font-bold text-text-heading">{decomposition.hexString}</span>
          </div>
        </div>

        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-rose mb-1">Sign Bit (1b)</div>
          <div className="font-mono text-xl sm:text-2xl font-black text-accent-rose my-1 flex items-center gap-2">
            <span>S = {decomposition.signBit}</span>
            <span className="text-xs font-normal text-text-muted">
              ({decomposition.signDecimal > 0 ? '+ Positive' : '- Negative'})
            </span>
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            (-1)^{decomposition.signBit} = {decomposition.signDecimal > 0 ? '+1' : '-1'}
          </div>
        </div>

        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-amber mb-1">Biased Exponent ({expLength}b)</div>
          <div className="font-mono text-xl sm:text-2xl font-black text-accent-amber my-1 truncate">
            E = {decomposition.exponentRaw}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Unbiased = {decomposition.exponentRaw} - {bias} = <span className="font-bold text-accent-amber">{decomposition.exponentUnbiased}</span>
          </div>
        </div>

        <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-accent-emerald mb-1">Classification</div>
          <div className="font-mono text-lg font-black text-accent-emerald my-1 truncate">
            {decomposition.classification}
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Implicit Bit: <span className="font-bold text-text-heading">{decomposition.implicitBit}</span>
          </div>
        </div>
      </div>

      {/* Interactive Bit Stream Ribbon (Click to flip bits) */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-border-main pb-2.5">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-accent-primary" />
            <h3 className="font-extrabold text-sm text-text-heading">
              Interactive {isSingle ? '32-Bit' : '64-Bit'} Register (Click any bit to toggle)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-accent-rose">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-rose inline-block" /> Sign [0]
            </span>
            <span className="flex items-center gap-1.5 text-accent-amber">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-amber inline-block" /> Exponent [1-{expLength}]
            </span>
            <span className="flex items-center gap-1.5 text-accent-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-primary inline-block" /> Mantissa [{1 + expLength}-{isSingle ? 31 : 63}]
            </span>
          </div>
        </div>

        {/* Visual Bit Boxes */}
        <div className="flex flex-wrap gap-1 p-3 bg-card-surface border border-border-main rounded-xl justify-center">
          {bits.split('').map((bit, idx) => {
            const isSign = idx === 0;
            const isExp = idx >= 1 && idx <= expLength;

            const bgClass = isSign
              ? bit === '1' ? 'bg-accent-rose text-white shadow-sm' : 'bg-accent-rose/10 text-accent-rose border-accent-rose/30'
              : isExp
              ? bit === '1' ? 'bg-accent-amber text-slate-950 shadow-sm' : 'bg-accent-amber/10 text-accent-amber border-accent-amber/30'
              : bit === '1' ? 'bg-accent-primary text-white shadow-sm' : 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';

            return (
              <button
                key={idx}
                onClick={() => handleToggleBit(idx)}
                title={`Bit ${idx}: Click to toggle`}
                className={`w-7 h-9 rounded-lg font-mono text-sm font-black border flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${bgClass}`}
              >
                <span>{bit}</span>
                <span className="text-[8px] opacity-70 font-bold">{idx}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mathematical Breakdown & Formula Card */}
      <ExplanationCard
        title={`IEEE-754 Formula: ${decomposition.formulaDisplay}`}
        badge={decomposition.classification}
        badgeColor={decomposition.classification === 'NORMAL' ? 'cyan' : 'amber'}
        actionTaken={`Value = (-1)^${decomposition.signBit} × (${decomposition.implicitBit} + ${decomposition.mantissaFraction.toFixed(7)}) × 2^(${decomposition.exponentUnbiased}) = ${decomposition.decimalValue}`}
        explanation="Standard floating point format decomposes any real number into Sign (S), Biased Exponent (E), and Mantissa/Fraction (M). Normal numbers feature an implicit leading '1' before the binary point, saving one bit of precision."
        subNotes={decomposition.stepsExplanation}
      />
    </div>
  );
};
