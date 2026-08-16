export interface TLBEntry {
  vpn: number;
  pfn: number;
  valid: boolean;
  tag: string;
}

export interface PageTableEntry {
  vpn: number;
  pfn: number | null;
  valid: boolean; // 1 = in RAM, 0 = on Disk (Page Fault)
  dirty: boolean;
  reference: boolean;
  diskSector: number;
}

export interface PhysicalFrame {
  frameNumber: number;
  vpnLoaded: number | null;
  isAllocated: boolean;
}

export interface VMConfig {
  virtualAddressBits: number; // e.g. 16 bits (64 KB address space)
  physicalAddressBits: number; // e.g. 14 bits (16 KB RAM)
  pageSizeBytes: number; // e.g. 4096 (4 KB = 12 offset bits)
  tlbSize: number; // e.g. 4 entries
}

export interface VMStep {
  stepIndex: number;
  stage: 'VA_SPLIT' | 'TLB_LOOKUP' | 'PAGE_TABLE_LOOKUP' | 'PAGE_FAULT_HANDLER' | 'PA_CALCULATE' | 'COMPLETE';
  title: string;
  description: string;
  explanation: string;
  activeComponent: 'CPU' | 'TLB' | 'PAGE_TABLE' | 'RAM' | 'DISK';
  isTLBHit: boolean;
  isPageFault: boolean;
  highlightedVPN?: number;
  highlightedPFN?: number;
  highlightedFrame?: number;
}

export interface VMSimulationResult {
  virtualAddress: number;
  vpn: number;
  offset: number;
  offsetBits: number;
  vpnBits: number;
  pfnBits: number;
  physicalAddress: number;
  isTLBHit: boolean;
  isPageFault: boolean;
  steps: VMStep[];
  tlbState: TLBEntry[];
  pageTableState: PageTableEntry[];
  ramFramesState: PhysicalFrame[];
  explanation: string;
  actionTaken: string;
}

export function createInitialVMState(config: VMConfig) {
  const { virtualAddressBits, physicalAddressBits, pageSizeBytes, tlbSize } = config;
  const offsetBits = Math.log2(pageSizeBytes);
  const totalPages = 1 << (virtualAddressBits - offsetBits); // 2^(16-12) = 16 pages
  const totalFrames = 1 << (physicalAddressBits - offsetBits); // 2^(14-12) = 4 frames

  // Initial Page Table: Pages 0, 1, 2 in RAM (Frames 0, 1, 2), Pages 3..15 on Disk
  const pageTable: PageTableEntry[] = Array.from({ length: totalPages }, (_, vpn) => {
    const inRam = vpn < 3;
    return {
      vpn,
      pfn: inRam ? vpn : null,
      valid: inRam,
      dirty: false,
      reference: inRam,
      diskSector: 100 + vpn * 8,
    };
  });

  // Initial TLB: holds VPN 0 -> Frame 0, VPN 1 -> Frame 1
  const tlb: TLBEntry[] = Array.from({ length: tlbSize }, (_, i) => {
    if (i === 0) return { vpn: 0, pfn: 0, valid: true, tag: 'VPN 0 ➔ Frame 0' };
    if (i === 1) return { vpn: 1, pfn: 1, valid: true, tag: 'VPN 1 ➔ Frame 1' };
    return { vpn: 0, pfn: 0, valid: false, tag: 'Empty' };
  });

  // Initial RAM Frames
  const ramFrames: PhysicalFrame[] = Array.from({ length: totalFrames }, (_, f) => ({
    frameNumber: f,
    vpnLoaded: f < 3 ? f : null,
    isAllocated: f < 3,
  }));

  return { pageTable, tlb, ramFrames, offsetBits, totalPages, totalFrames };
}

export function simulateVirtualMemoryAccess(
  virtualAddress: number,
  config: VMConfig,
  currentTLB: TLBEntry[],
  currentPageTable: PageTableEntry[],
  currentRAM: PhysicalFrame[]
): VMSimulationResult {
  const offsetBits = Math.log2(config.pageSizeBytes);
  const vpnBits = config.virtualAddressBits - offsetBits;
  const pfnBits = config.physicalAddressBits - offsetBits;

  const offsetMask = (1 << offsetBits) - 1;
  const offset = virtualAddress & offsetMask;
  const vpn = virtualAddress >> offsetBits;

  const steps: VMStep[] = [];
  let tlbState = JSON.parse(JSON.stringify(currentTLB)) as TLBEntry[];
  let pageTableState = JSON.parse(JSON.stringify(currentPageTable)) as PageTableEntry[];
  let ramFramesState = JSON.parse(JSON.stringify(currentRAM)) as PhysicalFrame[];

  // Step 1: VA Split
  steps.push({
    stepIndex: 1,
    stage: 'VA_SPLIT',
    title: 'Decompose Virtual Address',
    description: `Virtual Address 0x${virtualAddress.toString(16).toUpperCase()} split into VPN: ${vpn} (0x${vpn.toString(16).toUpperCase()}) and Offset: ${offset} (0x${offset.toString(16).toUpperCase()}).`,
    explanation: `Virtual address space has ${vpnBits} VPN bits (${1 << vpnBits} pages) and ${offsetBits} offset bits (${config.pageSizeBytes} B per page).`,
    activeComponent: 'CPU',
    isTLBHit: false,
    isPageFault: false,
    highlightedVPN: vpn,
  });

  // Step 2: Check TLB
  const tlbMatchIndex = tlbState.findIndex((entry) => entry.valid && entry.vpn === vpn);
  const isTLBHit = tlbMatchIndex !== -1;

  if (isTLBHit) {
    const pfn = tlbState[tlbMatchIndex].pfn;
    const physicalAddress = (pfn << offsetBits) | offset;

    steps.push({
      stepIndex: 2,
      stage: 'TLB_LOOKUP',
      title: 'TLB Lookup: HIT (Fast Path)',
      description: `VPN ${vpn} matched in TLB Slot #${tlbMatchIndex} ➔ PFN ${pfn}.`,
      explanation: `Fast associative translation in hardware cache (TLB). Memory access time: 1 cycle.`,
      activeComponent: 'TLB',
      isTLBHit: true,
      isPageFault: false,
      highlightedVPN: vpn,
      highlightedPFN: pfn,
    });

    steps.push({
      stepIndex: 3,
      stage: 'PA_CALCULATE',
      title: 'Calculate Physical Address',
      description: `PA = (PFN ${pfn} << ${offsetBits}) | Offset ${offset} = 0x${physicalAddress.toString(16).toUpperCase()}.`,
      explanation: `Physical Frame Number ${pfn} concatenated with original Offset ${offset} forms the physical RAM memory address.`,
      activeComponent: 'RAM',
      isTLBHit: true,
      isPageFault: false,
      highlightedPFN: pfn,
    });

    return {
      virtualAddress,
      vpn,
      offset,
      offsetBits,
      vpnBits,
      pfnBits,
      physicalAddress,
      isTLBHit: true,
      isPageFault: false,
      steps,
      tlbState,
      pageTableState,
      ramFramesState,
      explanation: `TLB Hit for VPN ${vpn} ➔ Physical Address 0x${physicalAddress.toString(16).toUpperCase()}`,
      actionTaken: `Fast-path address translation via TLB Cache in 1 cycle.`,
    };
  }

  // TLB MISS -> Look in Page Table
  steps.push({
    stepIndex: 2,
    stage: 'TLB_LOOKUP',
    title: 'TLB Lookup: MISS',
    description: `VPN ${vpn} was not found in TLB. Proceeding to Page Table lookup in main memory.`,
    explanation: `TLB miss requires a memory access to read the Page Table Entry (PTE) for Page #${vpn}.`,
    activeComponent: 'TLB',
    isTLBHit: false,
    isPageFault: false,
    highlightedVPN: vpn,
  });

  const pte = pageTableState[vpn];
  const isPageFault = !pte || !pte.valid;

  if (!isPageFault && pte.pfn !== null) {
    // Soft Miss: Page Table Hit
    const pfn = pte.pfn;
    const physicalAddress = (pfn << offsetBits) | offset;

    steps.push({
      stepIndex: 3,
      stage: 'PAGE_TABLE_LOOKUP',
      title: 'Page Table Lookup: HIT (Valid Bit = 1)',
      description: `PTE[${vpn}] is valid (in RAM). Physical Frame Number = ${pfn}.`,
      explanation: `Page Table indicates Virtual Page #${vpn} is resident in Physical RAM Frame #${pfn}.`,
      activeComponent: 'PAGE_TABLE',
      isTLBHit: false,
      isPageFault: false,
      highlightedVPN: vpn,
      highlightedPFN: pfn,
    });

    // Update TLB entry (replace slot 0 or circular)
    tlbState[0] = {
      vpn,
      pfn,
      valid: true,
      tag: `VPN ${vpn} ➔ Frame ${pfn}`,
    };

    steps.push({
      stepIndex: 4,
      stage: 'PA_CALCULATE',
      title: 'Update TLB & Calculate Physical Address',
      description: `Loaded (VPN ${vpn} ➔ Frame ${pfn}) into TLB. PA = 0x${physicalAddress.toString(16).toUpperCase()}.`,
      explanation: `Future accesses to Page #${vpn} will hit directly in the TLB cache.`,
      activeComponent: 'RAM',
      isTLBHit: false,
      isPageFault: false,
      highlightedPFN: pfn,
    });

    return {
      virtualAddress,
      vpn,
      offset,
      offsetBits,
      vpnBits,
      pfnBits,
      physicalAddress,
      isTLBHit: false,
      isPageFault: false,
      steps,
      tlbState,
      pageTableState,
      ramFramesState,
      explanation: `Page Table Hit for VPN ${vpn} ➔ Frame ${pfn}. TLB updated.`,
      actionTaken: `Resolved via Page Table. TLB updated with new mapping.`,
    };
  }

  // Hard Miss: PAGE FAULT
  // Step 3: Page Fault Detected
  steps.push({
    stepIndex: 3,
    stage: 'PAGE_TABLE_LOOKUP',
    title: 'Page Table Lookup: PAGE FAULT (Valid Bit = 0)',
    description: `PTE[${vpn}] valid bit is 0! Page #${vpn} is not in RAM; stored on secondary disk sector #${pte ? pte.diskSector : 100}.`,
    explanation: `Hardware triggers an OS Page Fault Interrupt Trap (Software Exception). CPU context is saved.`,
    activeComponent: 'PAGE_TABLE',
    isTLBHit: false,
    isPageFault: true,
    highlightedVPN: vpn,
  });

  // Step 4: Page Fault Handler (Disk Swap-in + Frame Allocation)
  // Find a free frame or evict frame 3
  let allocatedFrame = ramFramesState.findIndex((f) => !f.isAllocated);
  if (allocatedFrame === -1) {
    allocatedFrame = 3; // Evict Frame 3
    const oldVpn = ramFramesState[allocatedFrame].vpnLoaded;
    if (oldVpn !== null && pageTableState[oldVpn]) {
      pageTableState[oldVpn].valid = false;
      pageTableState[oldVpn].pfn = null;
    }
  }

  ramFramesState[allocatedFrame] = {
    frameNumber: allocatedFrame,
    vpnLoaded: vpn,
    isAllocated: true,
  };

  // Update Page Table
  pageTableState[vpn] = {
    ...pageTableState[vpn],
    pfn: allocatedFrame,
    valid: true,
    reference: true,
  };

  // Update TLB
  tlbState[tlbState.length - 1] = {
    vpn,
    pfn: allocatedFrame,
    valid: true,
    tag: `VPN ${vpn} ➔ Frame ${allocatedFrame}`,
  };

  const physicalAddress = (allocatedFrame << offsetBits) | offset;

  steps.push({
    stepIndex: 4,
    stage: 'PAGE_FAULT_HANDLER',
    title: 'OS Page Fault Handler: Swap-In from Disk to RAM Frame #' + allocatedFrame,
    description: `DMA fetched 4KB page from Disk Sector #${pageTableState[vpn].diskSector} into RAM Frame #${allocatedFrame}. Page Table & TLB updated.`,
    explanation: `OS updates PTE[${vpn}] (Valid=1, PFN=${allocatedFrame}) and refills TLB. Process is resumed.`,
    activeComponent: 'DISK',
    isTLBHit: false,
    isPageFault: true,
    highlightedVPN: vpn,
    highlightedPFN: allocatedFrame,
    highlightedFrame: allocatedFrame,
  });

  steps.push({
    stepIndex: 5,
    stage: 'PA_CALCULATE',
    title: 'Resume & Compute Physical Address',
    description: `Instruction retried. Translation succeeds with PA = 0x${physicalAddress.toString(16).toUpperCase()}.`,
    explanation: `Address translation complete after servicing page fault from secondary storage.`,
    activeComponent: 'RAM',
    isTLBHit: false,
    isPageFault: true,
    highlightedPFN: allocatedFrame,
  });

  return {
    virtualAddress,
    vpn,
    offset,
    offsetBits,
    vpnBits,
    pfnBits,
    physicalAddress,
    isTLBHit: false,
    isPageFault: true,
    steps,
    tlbState,
    pageTableState,
    ramFramesState,
    explanation: `Page Fault Serviced: Swapped VPN ${vpn} into Frame #${allocatedFrame} ➔ PA 0x${physicalAddress.toString(16).toUpperCase()}`,
    actionTaken: `Page Fault Trap resolved: Page fetched from disk, Page Table & TLB updated.`,
  };
}
