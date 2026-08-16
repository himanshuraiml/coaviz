export type ReplacementPolicy = 'LRU' | 'FIFO' | 'LFU';

export interface CacheSlotState {
  index: number;
  valid: boolean;
  tag: number | null;
  tagLabel: string;
  lruTimestamp: number; // last access timestamp for LRU
  fifoInsertionOrder: number; // insertion timestamp for FIFO
  lfuAccessCount: number; // frequency count for LFU
  isHitSlot?: boolean;
  isEvictedSlot?: boolean;
}

export interface ReplacementStep {
  stepNumber: number;
  addressAccessed: number;
  tagAccessed: number;
  tagLabel: string;
  isHit: boolean;
  hitSlotIndex?: number;
  evictedSlotIndex?: number;
  evictedTag?: number | null;
  policy: ReplacementPolicy;
  slots: CacheSlotState[];
  cumulativeHits: number;
  cumulativeMisses: number;
  hitRatio: number; // 0..100 %
  explanation: string;
  actionTaken: string;
}

export interface ReplacementSimulationResult {
  policy: ReplacementPolicy;
  cacheCapacity: number; // number of slots (e.g. 4 slots)
  accessSequence: number[];
  steps: ReplacementStep[];
  totalHits: number;
  totalMisses: number;
  finalHitRatio: number;
}

export const PRESET_ACCESS_PATTERNS: { name: string; description: string; sequence: number[] }[] = [
  {
    name: 'Loop Sequence (Temporal Locality)',
    description: 'Repeatedly accessing a tight loop of blocks [1, 2, 3, 1, 2, 4, 1, 2, 3, 4]. Highlights LRU advantages.',
    sequence: [1, 2, 3, 1, 2, 4, 1, 2, 3, 4],
  },
  {
    name: 'Belady’s Anomaly & FIFO Demonstration',
    description: 'Classic reference stream [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5] illustrating difference between FIFO and LRU.',
    sequence: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
  },
  {
    name: 'Thrashing Pattern (Cyclic Overcapacity)',
    description: 'Stream exceeding cache size cycling strictly [1, 2, 3, 4, 5, 1, 2, 3, 4, 5] causing 100% cache misses in FIFO/LRU.',
    sequence: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
  },
  {
    name: 'Frequency Skew (LFU Benchmark)',
    description: 'Block 1 accessed very frequently, while blocks 2, 3, 4, 5 cycle through. LFU preserves block 1 indefinitely.',
    sequence: [1, 1, 1, 2, 3, 4, 1, 5, 1, 2, 1],
  },
];

export function simulateCacheReplacement(
  sequence: number[],
  capacity: number = 4,
  policy: ReplacementPolicy = 'LRU'
): ReplacementSimulationResult {
  let slots: CacheSlotState[] = Array.from({ length: capacity }, (_, i) => ({
    index: i,
    valid: false,
    tag: null,
    tagLabel: '---',
    lruTimestamp: 0,
    fifoInsertionOrder: 0,
    lfuAccessCount: 0,
  }));

  const steps: ReplacementStep[] = [];
  let hits = 0;
  let misses = 0;
  let timeCounter = 1;

  for (let sIdx = 0; sIdx < sequence.length; sIdx++) {
    const tag = sequence[sIdx];
    const tagLabel = `Tag ${tag}`;

    // Check for Hit
    const hitIdx = slots.findIndex((slot) => slot.valid && slot.tag === tag);
    const isHit = hitIdx !== -1;

    let evictedSlotIndex: number | undefined = undefined;
    let evictedTag: number | null = null;
    let targetSlotIndex = hitIdx;

    if (isHit) {
      hits++;
      // Update hit slot metadata
      slots = slots.map((slot, idx) => {
        if (idx === hitIdx) {
          return {
            ...slot,
            lruTimestamp: timeCounter,
            lfuAccessCount: slot.lfuAccessCount + 1,
            isHitSlot: true,
            isEvictedSlot: false,
          };
        }
        return { ...slot, isHitSlot: false, isEvictedSlot: false };
      });
    } else {
      misses++;
      // Check for an empty slot first
      const emptyIdx = slots.findIndex((slot) => !slot.valid);

      if (emptyIdx !== -1) {
        targetSlotIndex = emptyIdx;
        slots = slots.map((slot, idx) => {
          if (idx === emptyIdx) {
            return {
              ...slot,
              valid: true,
              tag,
              tagLabel,
              lruTimestamp: timeCounter,
              fifoInsertionOrder: timeCounter,
              lfuAccessCount: 1,
              isHitSlot: false,
              isEvictedSlot: false,
            };
          }
          return { ...slot, isHitSlot: false, isEvictedSlot: false };
        });
      } else {
        // Cache is FULL: Must Evict according to policy
        if (policy === 'LRU') {
          // Find slot with minimum lruTimestamp
          let minTime = Infinity;
          let victimIdx = 0;
          slots.forEach((slot, idx) => {
            if (slot.lruTimestamp < minTime) {
              minTime = slot.lruTimestamp;
              victimIdx = idx;
            }
          });
          evictedSlotIndex = victimIdx;
        } else if (policy === 'FIFO') {
          // Find slot with minimum fifoInsertionOrder
          let minOrder = Infinity;
          let victimIdx = 0;
          slots.forEach((slot, idx) => {
            if (slot.fifoInsertionOrder < minOrder) {
              minOrder = slot.fifoInsertionOrder;
              victimIdx = idx;
            }
          });
          evictedSlotIndex = victimIdx;
        } else {
          // LFU: Find slot with lowest access count, breaking tie with oldest LRU timestamp
          let minFreq = Infinity;
          let oldestTime = Infinity;
          let victimIdx = 0;
          slots.forEach((slot, idx) => {
            if (slot.lfuAccessCount < minFreq || (slot.lfuAccessCount === minFreq && slot.lruTimestamp < oldestTime)) {
              minFreq = slot.lfuAccessCount;
              oldestTime = slot.lruTimestamp;
              victimIdx = idx;
            }
          });
          evictedSlotIndex = victimIdx;
        }

        evictedTag = slots[evictedSlotIndex].tag;
        targetSlotIndex = evictedSlotIndex;

        slots = slots.map((slot, idx) => {
          if (idx === evictedSlotIndex) {
            return {
              ...slot,
              valid: true,
              tag,
              tagLabel,
              lruTimestamp: timeCounter,
              fifoInsertionOrder: timeCounter,
              lfuAccessCount: 1,
              isHitSlot: false,
              isEvictedSlot: true,
            };
          }
          return { ...slot, isHitSlot: false, isEvictedSlot: false };
        });
      }
    }

    const currentTotal = hits + misses;
    const hitRatio = Number(((hits / currentTotal) * 100).toFixed(1));

    let explanation = '';
    let actionTaken = '';

    if (isHit) {
      explanation = `Access to ${tagLabel}: Found in Cache Slot #${hitIdx}. Access time updated.`;
      actionTaken = `CACHE HIT (Slot #${hitIdx}) — Latency 1 cycle`;
    } else if (evictedSlotIndex !== undefined) {
      explanation = `Access to ${tagLabel}: Cache Full! Under ${policy} policy, Slot #${evictedSlotIndex} (holding Tag ${evictedTag}) was selected as the victim and replaced.`;
      actionTaken = `CACHE MISS & EVICTION — Replaced Tag ${evictedTag} in Slot #${evictedSlotIndex}`;
    } else {
      explanation = `Access to ${tagLabel}: Cache Miss. Populated empty Slot #${targetSlotIndex}.`;
      actionTaken = `CACHE MISS — Loaded into free Slot #${targetSlotIndex}`;
    }

    steps.push({
      stepNumber: sIdx + 1,
      addressAccessed: tag,
      tagAccessed: tag,
      tagLabel,
      isHit,
      hitSlotIndex: isHit ? hitIdx : undefined,
      evictedSlotIndex,
      evictedTag,
      policy,
      slots: JSON.parse(JSON.stringify(slots)),
      cumulativeHits: hits,
      cumulativeMisses: misses,
      hitRatio,
      explanation,
      actionTaken,
    });

    timeCounter++;
  }

  const finalHitRatio = steps.length > 0 ? steps[steps.length - 1].hitRatio : 0;

  return {
    policy,
    cacheCapacity: capacity,
    accessSequence: sequence,
    steps,
    totalHits: hits,
    totalMisses: misses,
    finalHitRatio,
  };
}
