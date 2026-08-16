import { describe, it, expect } from 'vitest';
import { simulateIOTransfer } from './ioTransfer.ts';

describe('I/O Transfer Modes Engine', () => {
  it('simulates Programmed I/O polling mode correctly with wasted cycles', () => {
    const result = simulateIOTransfer({
      mode: 'PROGRAMMED_IO',
      deviceType: 'KEYBOARD',
      dataToTransfer: [0x41, 0x42], // 'A', 'B'
      deviceLatencyCycles: 3,
    });

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.transferredData).toEqual([0x41, 0x42]);
    expect(result.wastedPollingCycles).toBe(6); // 2 bytes * 3 polling cycles
    expect(result.productiveCycles).toBeGreaterThan(0);
    expect(result.cpuUtilizationPercentage).toBeLessThan(100);
  });

  it('simulates Interrupt-Driven I/O with 0 wasted polling cycles and stack save', () => {
    const result = simulateIOTransfer({
      mode: 'INTERRUPT_DRIVEN',
      deviceType: 'DISK_SECTOR',
      dataToTransfer: [0x58],
      deviceLatencyCycles: 4,
    });

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.transferredData).toEqual([0x58]);
    expect(result.wastedPollingCycles).toBe(0);
    expect(result.cpuUtilizationPercentage).toBe(100);

    const intStep = result.steps.find((s) => s.phase === 'INTERRUPT_TRIGGER');
    expect(intStep).toBeDefined();
    expect(intStep?.signalLines.intr).toBe(true);

    const stackStep = result.steps.find((s) => s.phase === 'SAVE_CONTEXT_STACK');
    expect(stackStep).toBeDefined();
  });
});
