import { describe, it, expect } from 'vitest';
import { 
  parseAddressDecomposition, 
  simulateCacheMapping, 
  initializeEmptyCache, 
  CacheConfig 
} from './cacheMapping.ts';

describe('Cache Memory Mapping Engine', () => {
  it('correctly decomposes 16-bit address for Direct Mapped cache', () => {
    const config: CacheConfig = {
      addressBits: 16,
      cacheSizeBytes: 512, // 32 lines
      blockSizeBytes: 16,  // 4 offset bits (2^4 = 16)
      mappingType: 'DIRECT',
    };
    // 32 lines = 5 index bits (2^5 = 32)
    // tag bits = 16 - 5 - 4 = 7 bits
    const decomp = parseAddressDecomposition(0x1A2B, config);
    expect(decomp.offsetBitsCount).toBe(4);
    expect(decomp.indexBitsCount).toBe(5);
    expect(decomp.tagBitsCount).toBe(7);
  });

  it('correctly decomposes address for Fully Associative cache', () => {
    const config: CacheConfig = {
      addressBits: 16,
      cacheSizeBytes: 256,
      blockSizeBytes: 16,
      mappingType: 'ASSOCIATIVE',
    };
    const decomp = parseAddressDecomposition(0x3C4D, config);
    expect(decomp.offsetBitsCount).toBe(4);
    expect(decomp.indexBitsCount).toBe(0);
    expect(decomp.tagBitsCount).toBe(12);
  });

  it('correctly detects miss and populates cache slot on first access', () => {
    const config: CacheConfig = {
      addressBits: 16,
      cacheSizeBytes: 64, // 4 lines
      blockSizeBytes: 16,
      mappingType: 'DIRECT',
    };
    const emptyCache = initializeEmptyCache(config);
    const result1 = simulateCacheMapping(0x10, config, emptyCache);
    expect(result1.isHit).toBe(false);
    expect(result1.cacheState[1].valid).toBe(true);

    // Second access to same line and tag should hit
    const result2 = simulateCacheMapping(0x14, config, result1.cacheState);
    expect(result2.isHit).toBe(true);
  });
});
