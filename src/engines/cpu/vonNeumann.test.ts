import { describe, it, expect } from 'vitest';
import { simulateVonNeumann } from './vonNeumann.ts';

describe('Von Neumann Architecture Simulation Engine', () => {
  it('simulates full stored-program execution (Fetch, Decode, Operand Fetch, Execute, Store) correctly', () => {
    const result = simulateVonNeumann({
      programName: 'ADD_TWO_NUMBERS',
      customA: 20,
      customB: 35,
    });

    expect(result.steps.length).toBeGreaterThan(10);
    expect(result.finalAccumulator).toBe(55);
    expect(result.busAccessCount.instructionFetches).toBeGreaterThan(0);
    expect(result.busAccessCount.dataAccesses).toBeGreaterThan(0);

    // Verify stored-program memory state
    const lastStep = result.steps[result.steps.length - 1];
    const sumCell = lastStep.memory.find((m) => m.address === 0x22);
    expect(sumCell?.value).toBe(55);

    // Verify bottleneck detection
    const bottleneckStep = result.steps.find((s) => s.bottleneckActive);
    expect(bottleneckStep).toBeDefined();
  });
});
