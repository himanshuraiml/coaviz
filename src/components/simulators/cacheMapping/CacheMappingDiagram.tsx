import React from 'react';
import { CacheMappingResult, CacheLineSlot, MappingStep, MappingType } from '../../../engines/memory/cacheMapping.ts';
import { AnimatedWire } from '../../schematic/SvgDiagram/AnimatedWire.tsx';
import { HwBlock } from '../../schematic/SvgDiagram/HwBlock.tsx';

interface CacheMappingDiagramProps {
  result: CacheMappingResult;
  activeStep: MappingStep;
  stepIndex: number;
  cacheSlots: CacheLineSlot[];
  addressInput: number;
  mappingType: MappingType;
  onClickBlock?: (block: string) => void;
}

// Layout: viewBox 960 × 420
const VB_W = 960;
const VB_H = 420;

export const CacheMappingDiagram: React.FC<CacheMappingDiagramProps> = ({
  result, activeStep, stepIndex, cacheSlots, addressInput, mappingType, onClickBlock,
}) => {
  const dec = result.decomposition;
  const phase = activeStep?.phase;

  // Which bits are "travelling" based on phase
  const tagActive   = phase === 'COMPARE_TAG' || phase === 'RESULT_HIT_MISS';
  const indexActive = phase === 'LOCATE_SET_LINE' || phase === 'COMPARE_TAG';
  const offsetActive = phase === 'RESULT_HIT_MISS' && result.isHit;

  // Visible cache lines (first 8 to keep diagram readable)
  const visibleSlots = cacheSlots.slice(0, 8);
  const highlightSet = activeStep?.highlightSlotIndices ?? [];

  // Colours
  const TAG_C   = '#0ea5e9';
  const IDX_C   = '#f59e0b';
  const OFF_C   = '#10b981';
  const HIT_C   = '#10b981';
  const MISS_C  = '#f43f5e';

  // ── Layout coordinates ──
  const ADDR_X = 20;
  const ADDR_Y = 40;
  const ADDR_W = 280;

  // Address bit field boxes
  const tagW   = Math.round((dec.tagBitsCount   / 16) * ADDR_W);
  const idxW   = Math.round((dec.indexBitsCount / 16) * ADDR_W);
  const offW   = ADDR_W - tagW - idxW;

  // Tag comparator
  const COMP_X = 100;
  const COMP_Y = 170;

  // Cache array
  const CACHE_X = 420;
  const CACHE_Y = 36;
  const SLOT_H  = 34;
  const SLOT_W  = 280;

  // Main memory block
  const MEM_X = 730;
  const MEM_Y = 200;

  // Output data block
  const OUT_X = 420;
  const OUT_Y = 340;

  return (
    <div className="diagram-panel w-full overflow-x-auto">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Cache Mapping — {mappingType.replace(/_/g, ' ')} · Address 0x{addressInput.toString(16).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded" style={{ background: TAG_C, display: 'inline-block' }} />
            TAG ({dec.tagBitsCount}b)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded" style={{ background: IDX_C, display: 'inline-block' }} />
            INDEX ({dec.indexBitsCount}b)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded" style={{ background: OFF_C, display: 'inline-block' }} />
            OFFSET ({dec.offsetBitsCount}b)
          </span>
          {phase === 'RESULT_HIT_MISS' && (
            <span className={`px-2 py-0.5 rounded font-bold border ${result.isHit
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-rose-100 text-rose-700 border-rose-300'}`}>
              {result.isHit ? '✓ CACHE HIT' : '✗ CACHE MISS'}
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ minWidth: 620, maxHeight: 440 }}
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        {/* ══════════════════════════════
             ADDRESS DECOMPOSITION
        ══════════════════════════════ */}

        {/* Address label */}
        <text x={ADDR_X} y={ADDR_Y - 10} fill="#334155" fontSize={10} fontWeight="700">
          Address: 0x{addressInput.toString(16).toUpperCase().padStart(4, '0')}
          {'  '}({dec.binaryString || dec.tagBinary + dec.indexBinary + dec.offsetBinary})
        </text>

        {/* TAG field */}
        <rect
          x={ADDR_X} y={ADDR_Y}
          width={tagW} height={36}
          rx={6}
          fill={tagActive ? '#e0f2fe' : '#f0f9ff'}
          stroke={TAG_C}
          strokeWidth={tagActive ? 2 : 1.5}
          style={{ filter: tagActive ? `drop-shadow(0 0 6px ${TAG_C}60)` : 'none', transition: 'all 0.4s' }}
        />
        <text x={ADDR_X + tagW / 2} y={ADDR_Y + 12} textAnchor="middle" fill={TAG_C} fontSize={8} fontWeight="700">TAG</text>
        <text x={ADDR_X + tagW / 2} y={ADDR_Y + 26} textAnchor="middle" fill="#0369a1" fontSize={10} fontWeight="800"
          fontFamily="'JetBrains Mono', monospace">{dec.tagBinary.slice(0, 10)}</text>

        {/* INDEX field */}
        {dec.indexBitsCount > 0 && (
          <>
            <rect
              x={ADDR_X + tagW} y={ADDR_Y}
              width={idxW} height={36}
              rx={0}
              fill={indexActive ? '#fef3c7' : '#fffbeb'}
              stroke={IDX_C}
              strokeWidth={indexActive ? 2 : 1.5}
              style={{ filter: indexActive ? `drop-shadow(0 0 6px ${IDX_C}60)` : 'none', transition: 'all 0.4s' }}
            />
            <text x={ADDR_X + tagW + idxW / 2} y={ADDR_Y + 12} textAnchor="middle" fill={IDX_C} fontSize={8} fontWeight="700">INDEX</text>
            <text x={ADDR_X + tagW + idxW / 2} y={ADDR_Y + 26} textAnchor="middle" fill="#b45309" fontSize={10} fontWeight="800"
              fontFamily="'JetBrains Mono', monospace">{dec.indexBinary || '—'}</text>
          </>
        )}

        {/* OFFSET field */}
        <rect
          x={ADDR_X + tagW + idxW} y={ADDR_Y}
          width={offW} height={36}
          rx={6}
          fill={offsetActive ? '#d1fae5' : '#ecfdf5'}
          stroke={OFF_C}
          strokeWidth={offsetActive ? 2 : 1.5}
          style={{ filter: offsetActive ? `drop-shadow(0 0 6px ${OFF_C}60)` : 'none', transition: 'all 0.4s' }}
        />
        <text x={ADDR_X + tagW + idxW + offW / 2} y={ADDR_Y + 12} textAnchor="middle" fill={OFF_C} fontSize={8} fontWeight="700">OFFSET</text>
        <text x={ADDR_X + tagW + idxW + offW / 2} y={ADDR_Y + 26} textAnchor="middle" fill="#065f46" fontSize={10} fontWeight="800"
          fontFamily="'JetBrains Mono', monospace">{dec.offsetBinary}</text>

        {/* ══════════════════════════════
             TAG COMPARATOR BLOCK
        ══════════════════════════════ */}
        <HwBlock
          x={COMP_X} y={COMP_Y}
          width={140} height={80}
          label="Tag Comparator"
          sublabel={tagActive ? `Compare: 0x${dec.tagValue.toString(16).toUpperCase()}` : 'Waiting...'}
          color={phase === 'RESULT_HIT_MISS' ? (result.isHit ? 'emerald' : 'rose') : 'indigo'}
          isActive={tagActive}
          onClick={() => onClickBlock?.('CACHE_TAG_COMPARATOR')}
        />

        {/* HIT/MISS result text inside comparator */}
        {phase === 'RESULT_HIT_MISS' && (
          <text
            x={COMP_X + 70} y={COMP_Y + 62}
            textAnchor="middle" dominantBaseline="middle"
            fill={result.isHit ? '#065f46' : '#9f1239'}
            fontSize={14} fontWeight="900"
          >
            {result.isHit ? '= ✓ HIT' : '≠ ✗ MISS'}
          </text>
        )}

        {/* ══════════════════════════════
             WIRES: Address → Comparator / Cache
        ══════════════════════════════ */}

        {/* TAG → Comparator */}
        <AnimatedWire
          x1={ADDR_X + tagW / 2} y1={ADDR_Y + 36}
          x2={COMP_X + 70} y2={COMP_Y}
          type="data"
          active={tagActive}
          value={`0x${dec.tagValue.toString(16).toUpperCase()}`}
          dir="elbow-left"
          animKey={`${stepIndex}_tag`}
          duration={800}
        />

        {/* INDEX → Cache Array (vertical elbow) */}
        {dec.indexBitsCount > 0 && (
          <AnimatedWire
            x1={ADDR_X + tagW + idxW / 2} y1={ADDR_Y + 36}
            x2={CACHE_X + 40} y2={CACHE_Y + Math.min(dec.indexValue, 7) * SLOT_H + SLOT_H / 2}
            type="address"
            active={indexActive}
            value={`Set #${dec.indexValue}`}
            dir="elbow-left"
            animKey={`${stepIndex}_idx`}
            duration={800}
          />
        )}

        {/* Comparator → HIT output data */}
        {result.isHit && phase === 'RESULT_HIT_MISS' && (
          <AnimatedWire
            x1={COMP_X + 70} y1={COMP_Y + 80}
            x2={OUT_X + 100} y2={OUT_Y}
            type="data"
            active={true}
            value="DATA READY"
            dir="elbow-right"
            animKey={`${stepIndex}_out`}
            duration={700}
          />
        )}

        {/* MISS → Main Memory */}
        {!result.isHit && phase === 'RESULT_HIT_MISS' && (
          <AnimatedWire
            x1={COMP_X + 140} y1={COMP_Y + 40}
            x2={MEM_X} y2={MEM_Y + 40}
            type="control"
            active={true}
            value="FETCH MISS"
            dir="h"
            animKey={`${stepIndex}_miss`}
            duration={900}
          />
        )}

        {/* ══════════════════════════════
             CACHE ARRAY (slots)
        ══════════════════════════════ */}
        <text x={CACHE_X} y={CACHE_Y - 10} fill="#334155" fontSize={10} fontWeight="700">
          Cache Array ({cacheSlots.length} Lines)
        </text>

        {visibleSlots.map((slot, i) => {
          const sy = CACHE_Y + i * SLOT_H;
          const isHighlighted = highlightSet.includes(slot.slotIndex);
          const isHitSlot = result.isHit && result.hitSlotIndex === slot.slotIndex;
          const isMissTarget = !result.isHit && isHighlighted && phase === 'RESULT_HIT_MISS';

          let fillColor = '#f8fafc';
          let strokeColor = '#e2e8f0';
          if (isHitSlot) { fillColor = '#d1fae5'; strokeColor = HIT_C; }
          else if (isMissTarget) { fillColor = '#fff1f2'; strokeColor = MISS_C; }
          else if (isHighlighted) { fillColor = '#eff6ff'; strokeColor = '#60a5fa'; }

          return (
            <g key={slot.slotIndex}>
              <rect
                x={CACHE_X} y={sy + 2}
                width={SLOT_W} height={SLOT_H - 4}
                rx={6}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isHitSlot || isMissTarget ? 2.5 : 1.5}
                style={{
                  filter: isHitSlot
                    ? 'drop-shadow(0 0 8px #10b98180)'
                    : isMissTarget ? 'drop-shadow(0 0 8px #f43f5e80)' : 'none',
                  transition: 'fill 0.4s, stroke 0.4s, filter 0.4s',
                }}
                className={isHitSlot ? 'anim-hit-flash' : isMissTarget ? 'anim-miss-flash' : ''}
              />
              {/* Slot index */}
              <text x={CACHE_X + 10} y={sy + SLOT_H / 2} dominantBaseline="middle"
                fill="#94a3b8" fontSize={8.5} fontWeight="700">
                {slot.setIndex !== undefined ? `Set${slot.setIndex}` : `L${slot.slotIndex}`}
              </text>
              {/* Valid bit */}
              <rect x={CACHE_X + 42} y={sy + 10} width={12} height={12} rx={2}
                fill={slot.valid ? '#d1fae5' : '#fee2e2'}
                stroke={slot.valid ? '#10b981' : '#f43f5e'} strokeWidth={1} />
              <text x={CACHE_X + 48} y={sy + 17} textAnchor="middle" dominantBaseline="middle"
                fill={slot.valid ? '#065f46' : '#9f1239'} fontSize={8} fontWeight="800">
                {slot.valid ? '1' : '0'}
              </text>
              {/* Tag stored */}
              <text x={CACHE_X + 65} y={sy + SLOT_H / 2} dominantBaseline="middle"
                fill={isHitSlot ? HIT_C : '#475569'} fontSize={9} fontWeight="700"
                fontFamily="'JetBrains Mono', monospace">
                {slot.tagHex}
              </text>
              {/* Data preview */}
              <text x={CACHE_X + 130} y={sy + SLOT_H / 2} dominantBaseline="middle"
                fill="#64748b" fontSize={8.5}
                fontFamily="'JetBrains Mono', monospace">
                {slot.dataBlockPreview.slice(0, 28)}
              </text>
              {/* HIT/MISS badge */}
              {(isHitSlot || isMissTarget) && (
                <g>
                  <rect x={CACHE_X + SLOT_W - 44} y={sy + 8} width={36} height={16} rx={4}
                    fill={isHitSlot ? HIT_C : MISS_C} />
                  <text x={CACHE_X + SLOT_W - 26} y={sy + 17} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={9} fontWeight="800">
                    {isHitSlot ? 'HIT' : 'MISS'}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ══════════════════════════════
             MAIN MEMORY BLOCK (on miss)
        ══════════════════════════════ */}
        <HwBlock
          x={MEM_X} y={MEM_Y}
          width={150} height={80}
          label="Main Memory"
          sublabel={!result.isHit && phase === 'RESULT_HIT_MISS' ? '⏳ Fetching block...' : 'DRAM (slow)'}
          color={!result.isHit && phase === 'RESULT_HIT_MISS' ? 'rose' : 'slate'}
          isActive={!result.isHit && phase === 'RESULT_HIT_MISS'}
          onClick={() => onClickBlock?.('SRAM_CELL')}
        />

        {/* ══════════════════════════════
             OUTPUT / DATA READY BLOCK
        ══════════════════════════════ */}
        <HwBlock
          x={OUT_X} y={OUT_Y}
          width={200} height={60}
          label={result.isHit && phase === 'RESULT_HIT_MISS' ? '✓ Data Output (1 cycle)' : 'Data Output'}
          sublabel={result.isHit && phase === 'RESULT_HIT_MISS'
            ? `Block from Slot ${result.hitSlotIndex}`
            : 'Waiting for result'}
          color={result.isHit && phase === 'RESULT_HIT_MISS' ? 'emerald' : 'slate'}
          isActive={result.isHit && phase === 'RESULT_HIT_MISS'}
        />

        {/* ══════════════════════════════
             PHASE LABEL BADGE
        ══════════════════════════════ */}
        <rect x={VB_W - 200} y={VB_H - 32} width={188} height={24} rx={6}
          fill={phase === 'RESULT_HIT_MISS'
            ? (result.isHit ? '#d1fae5' : '#fff1f2')
            : '#eff6ff'}
          stroke={phase === 'RESULT_HIT_MISS'
            ? (result.isHit ? HIT_C : MISS_C)
            : '#93c5fd'}
          strokeWidth={1.5}
        />
        <text
          x={VB_W - 106} y={VB_H - 16}
          textAnchor="middle" dominantBaseline="middle"
          fill={phase === 'RESULT_HIT_MISS'
            ? (result.isHit ? '#065f46' : '#9f1239')
            : '#1d4ed8'}
          fontSize={10} fontWeight="700"
        >
          {phase === 'PARSE_ADDRESS'   ? 'Step: Parsing Address' :
           phase === 'LOCATE_SET_LINE' ? 'Step: Locating Cache Set/Line' :
           phase === 'COMPARE_TAG'     ? 'Step: Comparing Tags' :
           result.isHit               ? '✓ HIT — Data Served from Cache' :
                                        '✗ MISS — Fetching from Memory'}
        </text>
      </svg>
    </div>
  );
};
