import { describe, it, expect } from 'vitest';
import { simulateDMA } from './dmaController.ts';

describe('DMA Controller Engine', () => {
  it('simulates Burst Mode with full HOLD/HLDA bus ownership and TC interrupt', () => {
    const result = simulateDMA({
      mode: 'BURST_MODE',
      direction: 'DEVICE_TO_MEMORY',
      startAddress: 0x4000,
      dataPayload: [0x48, 0x45, 0x4C, 0x4C, 0x4F], // 'HELLO'
      channel: 1,
    });

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.transferredBytes).toEqual([0x48, 0x45, 0x4C, 0x4C, 0x4F]);
    
    // Check TC step
    const tcStep = result.steps.find((s) => s.phase === 'TERMINAL_COUNT_DONE');
    expect(tcStep).toBeDefined();
    expect(tcStep?.signals.tc).toBe(true);

    // Check memory grid updated
    const cell0 = result.finalMemoryState.find((m) => m.address === 0x4000);
    expect(cell0?.value).toBe(0x48);
  });

  it('simulates Cycle Stealing Mode with bus release per byte', () => {
    const result = simulateDMA({
      mode: 'CYCLE_STEALING',
      direction: 'DEVICE_TO_MEMORY',
      startAddress: 0x5000,
      dataPayload: [0xAA, 0xBB],
      channel: 2,
    });

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.transferredBytes).toEqual([0xAA, 0xBB]);

    const releaseSteps = result.steps.filter((s) => s.phase === 'CYCLE_STEAL_RELEASE_BUS');
    expect(releaseSteps.length).toBe(2);
  });
});
