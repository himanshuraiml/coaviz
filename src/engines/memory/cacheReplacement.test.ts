import { describe, it, expect } from 'vitest';
import { simulateCacheReplacement } from './cacheReplacement.ts';

describe('Cache Replacement Policy Engine', () => {
  it('correctly tracks LRU policy with temporal reuse', () => {
    // 3 slots, sequence: 1, 2, 3, 1, 4
    // 1 -> Miss (1, -, -)
    // 2 -> Miss (1, 2, -)
    // 3 -> Miss (1, 2, 3)
    // 1 -> Hit  (1[latest], 2, 3)
    // 4 -> Miss, evict 2 (since 2 was least recently used: 2 < 3 < 1)
    const res = simulateCacheReplacement([1, 2, 3, 1, 4], 3, 'LRU');
    expect(res.totalHits).toBe(1);
    expect(res.totalMisses).toBe(4);
    const step5 = res.steps[4];
    expect(step5.evictedTag).toBe(2);
  });

  it('correctly tracks FIFO policy with arrival order', () => {
    // 3 slots, sequence: 1, 2, 3, 1, 4
    // 1 -> Miss (1, -, -)
    // 2 -> Miss (1, 2, -)
    // 3 -> Miss (1, 2, 3)
    // 1 -> Hit  (1[oldest arrival], 2, 3)
    // 4 -> Miss, FIFO evicts 1 (since 1 arrived first)
    const res = simulateCacheReplacement([1, 2, 3, 1, 4], 3, 'FIFO');
    expect(res.totalHits).toBe(1);
    const step5 = res.steps[4];
    expect(step5.evictedTag).toBe(1);
  });

  it('correctly tracks LFU policy with frequency counter', () => {
    // 3 slots, sequence: 1, 1, 1, 2, 3, 4
    // 1 freq=3, 2 freq=1, 3 freq=1
    // 4 arrives -> evicts 2 (lowest freq tie-breaker with 3)
    const res = simulateCacheReplacement([1, 1, 1, 2, 3, 4], 3, 'LFU');
    expect(res.totalHits).toBe(2);
    const step6 = res.steps[5];
    expect(step6.evictedTag).toBe(2);
  });
});
