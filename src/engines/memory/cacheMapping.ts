export type MappingType = 'DIRECT' | 'ASSOCIATIVE' | 'SET_ASSOCIATIVE_2WAY' | 'SET_ASSOCIATIVE_4WAY';

export interface CacheConfig {
  addressBits: number; // e.g. 16 bits
  cacheSizeBytes: number; // e.g. 512 bytes
  blockSizeBytes: number; // e.g. 16 bytes
  mappingType: MappingType;
}

export interface AddressDecomposition {
  address: number;
  binaryString: string;
  tagBitsCount: number;
  indexBitsCount: number;
  offsetBitsCount: number;
  tagValue: number;
  tagBinary: string;
  indexValue: number; // line index or set index
  indexBinary: string;
  offsetValue: number;
  offsetBinary: string;
}

export interface CacheLineSlot {
  slotIndex: number;
  setIndex?: number;
  wayIndex?: number;
  valid: boolean;
  tag: number | null;
  tagHex: string;
  dataBlockPreview: string;
  isRecentlyAccessed?: boolean;
}

export interface MappingStep {
  stepIndex: number;
  phase: 'PARSE_ADDRESS' | 'LOCATE_SET_LINE' | 'COMPARE_TAG' | 'RESULT_HIT_MISS';
  title: string;
  description: string;
  explanation: string;
  highlightSlotIndices: number[];
  isHit: boolean;
  matchedSlotIndex?: number;
}

export interface CacheMappingResult {
  config: CacheConfig;
  totalLines: number;
  totalSets: number;
  waysPerSet: number;
  decomposition: AddressDecomposition;
  steps: MappingStep[];
  cacheState: CacheLineSlot[];
  isHit: boolean;
  hitSlotIndex?: number;
}

export function parseAddressDecomposition(
  address: number,
  config: CacheConfig
): AddressDecomposition {
  const { addressBits, cacheSizeBytes, blockSizeBytes, mappingType } = config;

  const offsetBitsCount = Math.log2(blockSizeBytes);
  const totalLines = cacheSizeBytes / blockSizeBytes;

  let waysPerSet = 1;
  if (mappingType === 'SET_ASSOCIATIVE_2WAY') waysPerSet = 2;
  if (mappingType === 'SET_ASSOCIATIVE_4WAY') waysPerSet = 4;
  if (mappingType === 'ASSOCIATIVE') waysPerSet = totalLines;

  const totalSets = totalLines / waysPerSet;
  const indexBitsCount = mappingType === 'ASSOCIATIVE' ? 0 : Math.log2(totalSets);
  const tagBitsCount = addressBits - indexBitsCount - offsetBitsCount;

  // Mask & Extract values
  const offsetMask = (1 << offsetBitsCount) - 1;
  const offsetValue = address & offsetMask;

  let indexValue = 0;
  if (indexBitsCount > 0) {
    const indexMask = (1 << indexBitsCount) - 1;
    indexValue = (address >> offsetBitsCount) & indexMask;
  }

  const tagValue = address >> (offsetBitsCount + indexBitsCount);

  const binPad = (val: number, len: number) => (val >>> 0).toString(2).padStart(len, '0').slice(-len);

  const fullBinary = binPad(address, addressBits);
  const tagBinary = binPad(tagValue, tagBitsCount);
  const indexBinary = indexBitsCount > 0 ? binPad(indexValue, indexBitsCount) : '';
  const offsetBinary = binPad(offsetValue, offsetBitsCount);

  return {
    address,
    binaryString: fullBinary,
    tagBitsCount,
    indexBitsCount,
    offsetBitsCount,
    tagValue,
    tagBinary,
    indexValue,
    indexBinary,
    offsetValue,
    offsetBinary,
  };
}

export function simulateCacheMapping(
  address: number,
  config: CacheConfig,
  currentCache: CacheLineSlot[]
): CacheMappingResult {
  const decomposition = parseAddressDecomposition(address, config);
  const { totalLines, totalSets, waysPerSet } = getCacheDimensions(config);

  const steps: MappingStep[] = [];
  let isHit = false;
  let hitSlotIndex: number | undefined = undefined;

  // Step 1: Address Parsing
  steps.push({
    stepIndex: 1,
    phase: 'PARSE_ADDRESS',
    title: 'Decompose Memory Address',
    description: `Address 0x${address.toString(16).toUpperCase()} (${address}) partitioned into Tag, Index, and Word Offset fields.`,
    explanation: `For ${config.mappingType} with ${config.addressBits}-bit address: Tag = ${decomposition.tagBitsCount} bits (0x${decomposition.tagValue.toString(16).toUpperCase()}), Index = ${decomposition.indexBitsCount} bits (${decomposition.indexValue}), Offset = ${decomposition.offsetBitsCount} bits (Byte ${decomposition.offsetValue}).`,
    highlightSlotIndices: [],
    isHit: false,
  });

  // Step 2: Set / Line Location
  const candidateIndices: number[] = [];
  if (config.mappingType === 'DIRECT') {
    candidateIndices.push(decomposition.indexValue);
  } else if (config.mappingType === 'ASSOCIATIVE') {
    for (let i = 0; i < totalLines; i++) candidateIndices.push(i);
  } else {
    // Set associative: candidate slots are [setIndex * ways ... setIndex * ways + ways - 1]
    const base = decomposition.indexValue * waysPerSet;
    for (let w = 0; w < waysPerSet; w++) {
      candidateIndices.push(base + w);
    }
  }

  steps.push({
    stepIndex: 2,
    phase: 'LOCATE_SET_LINE',
    title: config.mappingType === 'DIRECT' ? `Locate Cache Line #${decomposition.indexValue}` : config.mappingType === 'ASSOCIATIVE' ? 'Probe All Cache Lines (Full Search)' : `Locate Cache Set #${decomposition.indexValue}`,
    description: `Targeting cache slot(s) [${candidateIndices.join(', ')}] for comparison.`,
    explanation: config.mappingType === 'DIRECT'
      ? `Direct mapping maps address deterministically to Line index ${decomposition.indexValue}.`
      : config.mappingType === 'ASSOCIATIVE'
      ? `Fully associative mapping allows the block to reside anywhere in cache; all ${totalLines} tags are checked concurrently.`
      : `${waysPerSet}-Way Set Associative maps address to Set ${decomposition.indexValue}, checking ${waysPerSet} candidate lines.`,
    highlightSlotIndices: candidateIndices,
    isHit: false,
  });

  // Step 3: Compare Tags
  for (const idx of candidateIndices) {
    const slot = currentCache[idx];
    if (slot && slot.valid && slot.tag === decomposition.tagValue) {
      isHit = true;
      hitSlotIndex = idx;
      break;
    }
  }

  steps.push({
    stepIndex: 3,
    phase: 'COMPARE_TAG',
    title: 'Parallel Tag Comparator',
    description: `Comparing Address Tag (0x${decomposition.tagValue.toString(16).toUpperCase()}) with stored Cache Tags.`,
    explanation: isHit
      ? `Match found in Slot #${hitSlotIndex}! Valid bit = 1 and Tag matches 0x${decomposition.tagValue.toString(16).toUpperCase()}.`
      : `No matching tag found in target cache slots (or valid bit is 0). Cache Miss detected.`,
    highlightSlotIndices: isHit ? [hitSlotIndex!] : candidateIndices,
    isHit,
    matchedSlotIndex: hitSlotIndex,
  });

  // Step 4: Result
  steps.push({
    stepIndex: 4,
    phase: 'RESULT_HIT_MISS',
    title: isHit ? 'CACHE HIT: Word Retrieved' : 'CACHE MISS: Fetch Block from Main RAM',
    description: isHit
      ? `Data delivered immediately from Cache Slot #${hitSlotIndex} at offset byte ${decomposition.offsetValue}. Access latency ≈ 1 cycle.`
      : `Block containing address 0x${address.toString(16).toUpperCase()} fetched from Main Memory into Slot #${candidateIndices[0]} with Tag 0x${decomposition.tagValue.toString(16).toUpperCase()}.`,
    explanation: isHit
      ? `Cache hit avoids slow main memory access, maximizing effective memory access time (EMAT).`
      : `Cache miss incurs a memory stall penalty while the ${config.blockSizeBytes}-byte block is transferred into cache.`,
    highlightSlotIndices: isHit ? [hitSlotIndex!] : [candidateIndices[0]],
    isHit,
    matchedSlotIndex: hitSlotIndex,
  });

  // Updated Cache State if Miss
  const updatedCache = currentCache.map((slot, idx) => {
    if (!isHit && idx === candidateIndices[0]) {
      return {
        ...slot,
        valid: true,
        tag: decomposition.tagValue,
        tagHex: `0x${decomposition.tagValue.toString(16).toUpperCase()}`,
        dataBlockPreview: `Mem[0x${(address & ~(config.blockSizeBytes - 1)).toString(16).toUpperCase()}]`,
        isRecentlyAccessed: true,
      };
    }
    if (isHit && idx === hitSlotIndex) {
      return { ...slot, isRecentlyAccessed: true };
    }
    return { ...slot, isRecentlyAccessed: false };
  });

  return {
    config,
    totalLines,
    totalSets,
    waysPerSet,
    decomposition,
    steps,
    cacheState: updatedCache,
    isHit,
    hitSlotIndex,
  };
}

export function getCacheDimensions(config: CacheConfig) {
  const { cacheSizeBytes, blockSizeBytes, mappingType } = config;
  const totalLines = cacheSizeBytes / blockSizeBytes;
  let waysPerSet = 1;
  if (mappingType === 'SET_ASSOCIATIVE_2WAY') waysPerSet = 2;
  if (mappingType === 'SET_ASSOCIATIVE_4WAY') waysPerSet = 4;
  if (mappingType === 'ASSOCIATIVE') waysPerSet = totalLines;
  const totalSets = totalLines / waysPerSet;
  return { totalLines, totalSets, waysPerSet };
}

export function initializeEmptyCache(config: CacheConfig): CacheLineSlot[] {
  const { totalLines, waysPerSet } = getCacheDimensions(config);
  const slots: CacheLineSlot[] = [];
  for (let i = 0; i < totalLines; i++) {
    slots.push({
      slotIndex: i,
      setIndex: Math.floor(i / waysPerSet),
      wayIndex: i % waysPerSet,
      valid: false,
      tag: null,
      tagHex: '---',
      dataBlockPreview: 'Empty',
    });
  }
  return slots;
}
