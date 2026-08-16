import { describe, it, expect } from 'vitest';
import { 
  createInitialVMState, 
  simulateVirtualMemoryAccess, 
  VMConfig 
} from './virtualMemory.ts';

describe('Virtual Memory & TLB Flow Simulation Engine', () => {
  const config: VMConfig = {
    virtualAddressBits: 16,
    physicalAddressBits: 14,
    pageSizeBytes: 4096, // 4KB (12 offset bits)
    tlbSize: 4,
  };

  it('detects TLB Hit on pre-cached page (e.g. VPN 0)', () => {
    const state = createInitialVMState(config);
    // VA = 0x0123 -> VPN = 0, Offset = 0x123
    const res = simulateVirtualMemoryAccess(0x0123, config, state.tlb, state.pageTable, state.ramFrames);
    expect(res.isTLBHit).toBe(true);
    expect(res.isPageFault).toBe(false);
    expect(res.physicalAddress).toBe(0x0123);
  });

  it('handles TLB Miss with Page Table Hit (e.g. VPN 2)', () => {
    const state = createInitialVMState(config);
    // VA = 0x2456 -> VPN = 2 (in RAM Frame 2, but not in TLB)
    const res = simulateVirtualMemoryAccess(0x2456, config, state.tlb, state.pageTable, state.ramFrames);
    expect(res.isTLBHit).toBe(false);
    expect(res.isPageFault).toBe(false);
    expect(res.physicalAddress).toBe(0x2456);
    expect(res.tlbState.some((t) => t.vpn === 2)).toBe(true);
  });

  it('handles Page Fault for non-resident page (e.g. VPN 5) and swaps from disk into RAM', () => {
    const state = createInitialVMState(config);
    // VA = 0x5789 -> VPN = 5 (on disk initially)
    const res = simulateVirtualMemoryAccess(0x5789, config, state.tlb, state.pageTable, state.ramFrames);
    expect(res.isPageFault).toBe(true);
    expect(res.pageTableState[5].valid).toBe(true);
    expect(res.steps.some((s) => s.stage === 'PAGE_FAULT_HANDLER')).toBe(true);
  });
});
