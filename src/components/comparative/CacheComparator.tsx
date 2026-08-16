import React, { useMemo } from 'react';
import { 
  simulateCacheMapping, 
  initializeEmptyCache, 
  CacheConfig 
} from '../../engines/memory/cacheMapping.ts';
import { SplitSquareVertical } from 'lucide-react';

interface CacheComparatorProps {
  address: number;
}

export const CacheComparator: React.FC<CacheComparatorProps> = ({ address }) => {
  // Direct Mapping Config
  const directConfig: CacheConfig = useMemo(() => ({
    addressBits: 16,
    cacheSizeBytes: 256,
    blockSizeBytes: 16,
    mappingType: 'DIRECT',
  }), []);

  // 2-Way Set Associative Config
  const set2Config: CacheConfig = useMemo(() => ({
    addressBits: 16,
    cacheSizeBytes: 256,
    blockSizeBytes: 16,
    mappingType: 'SET_ASSOCIATIVE_2WAY',
  }), []);

  // Fully Associative Config
  const assocConfig: CacheConfig = useMemo(() => ({
    addressBits: 16,
    cacheSizeBytes: 256,
    blockSizeBytes: 16,
    mappingType: 'ASSOCIATIVE',
  }), []);

  const directRes = useMemo(() => {
    const slots = initializeEmptyCache(directConfig);
    return simulateCacheMapping(address, directConfig, slots);
  }, [address, directConfig]);

  const set2Res = useMemo(() => {
    const slots = initializeEmptyCache(set2Config);
    return simulateCacheMapping(address, set2Config, slots);
  }, [address, set2Config]);

  const assocRes = useMemo(() => {
    const slots = initializeEmptyCache(assocConfig);
    return simulateCacheMapping(address, assocConfig, slots);
  }, [address, assocConfig]);

  const hexAddress = `0x${address.toString(16).toUpperCase()}`;

  return (
    <div className="flex flex-col gap-4 p-4 bg-card-bg border border-border-main rounded-2xl shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-main pb-3">
        <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
          <SplitSquareVertical className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-text-heading">
            Side-by-Side Address Mapping Comparator: Direct vs 2-Way vs Fully Associative
          </h3>
          <p className="text-xs text-text-muted">
            Evaluation of Memory Address <span className="font-mono font-bold text-accent-primary">{hexAddress}</span> (16-bit)
          </p>
        </div>
      </div>

      {/* 3-Way Comparative Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Direct Mapping */}
        <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <h4 className="text-xs font-black text-text-heading uppercase tracking-wider">
              Direct Mapping
            </h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
              1-to-1 Fixed Line
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Tag ({directRes.decomposition.tagBitsCount}b)</span>
              <span className="text-sm font-black text-accent-primary">{directRes.decomposition.tagBinary}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Index / Line ({directRes.decomposition.indexBitsCount}b)</span>
              <span className="text-sm font-black text-accent-amber">{directRes.decomposition.indexBinary} (Line #{directRes.decomposition.indexValue})</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Offset ({directRes.decomposition.offsetBitsCount}b)</span>
              <span className="text-sm font-black text-accent-emerald">{directRes.decomposition.offsetBinary} ({directRes.decomposition.offsetValue}B)</span>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-border-main/50 text-[11px] text-text-muted">
            <strong>Pros/Cons:</strong> Fast 1 comparator lookup, but highest conflict rate if multiple addresses share Line #{directRes.decomposition.indexValue}.
          </div>
        </div>

        {/* 2. 2-Way Set Associative */}
        <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <h4 className="text-xs font-black text-text-heading uppercase tracking-wider">
              2-Way Set Associative
            </h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary">
              2 Slots per Set
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Tag ({set2Res.decomposition.tagBitsCount}b)</span>
              <span className="text-sm font-black text-accent-secondary">{set2Res.decomposition.tagBinary}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Set Index ({set2Res.decomposition.indexBitsCount}b)</span>
              <span className="text-sm font-black text-accent-amber">{set2Res.decomposition.indexBinary} (Set #{set2Res.decomposition.indexValue})</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Offset ({set2Res.decomposition.offsetBitsCount}b)</span>
              <span className="text-sm font-black text-accent-emerald">{set2Res.decomposition.offsetBinary} ({set2Res.decomposition.offsetValue}B)</span>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-border-main/50 text-[11px] text-text-muted">
            <strong>Pros/Cons:</strong> 2 parallel comparators in Set #{set2Res.decomposition.indexValue}. Drastically lowers conflict misses without excessive hardware.
          </div>
        </div>

        {/* 3. Fully Associative */}
        <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <h4 className="text-xs font-black text-text-heading uppercase tracking-wider">
              Fully Associative
            </h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              Any Free Slot
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Tag ({assocRes.decomposition.tagBitsCount}b - Full Addr)</span>
              <span className="text-sm font-black text-purple-600 dark:text-purple-400">{assocRes.decomposition.tagBinary}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Index Bits</span>
              <span className="text-sm font-black text-text-faint">0 bits (No Set/Line)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card-bg border border-border-main">
              <span className="text-[10px] text-text-muted block">Offset ({assocRes.decomposition.offsetBitsCount}b)</span>
              <span className="text-sm font-black text-accent-emerald">{assocRes.decomposition.offsetBinary} ({assocRes.decomposition.offsetValue}B)</span>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-border-main/50 text-[11px] text-text-muted">
            <strong>Pros/Cons:</strong> Zero conflict misses. Requires 16 simultaneous tag comparators (CAM).
          </div>
        </div>
      </div>
    </div>
  );
};
