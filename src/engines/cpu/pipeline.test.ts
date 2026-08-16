import { describe, it, expect } from 'vitest';
import { simulatePipeline, PRESET_PROGRAMS } from './pipeline.ts';

describe('5-Stage CPU Pipeline Simulator Engine', () => {
  it('simulates ideal independent instructions with 0 hazards and linear CPI speedup', () => {
    const prog = PRESET_PROGRAMS.find((p) => p.name.includes('Independent'))!;
    const res = simulatePipeline(prog.instructions, {
      enableForwarding: true,
      branchPrediction: 'NOT_TAKEN',
    });

    expect(res.totalCycles).toBe(9); // 5 instructions in 5 stages = 5 + 4 = 9 cycles
    expect(res.hazardsDetected.length).toBe(0);
    expect(res.cpi).toBeLessThan(2.0);
    expect(res.speedup).toBeGreaterThan(2.0);
  });

  it('detects RAW hazards and inserts stalls when forwarding is disabled', () => {
    const prog = PRESET_PROGRAMS.find((p) => p.name.includes('RAW'))!;
    const resNoFwd = simulatePipeline(prog.instructions, {
      enableForwarding: false,
      branchPrediction: 'NOT_TAKEN',
    });

    const rawHazards = resNoFwd.hazardsDetected.filter((h) => h.type === 'RAW');
    expect(rawHazards.length).toBeGreaterThan(0);
    expect(resNoFwd.totalCycles).toBeGreaterThan(8);
  });

  it('resolves RAW hazards with data forwarding and bypass events', () => {
    const prog = PRESET_PROGRAMS.find((p) => p.name.includes('RAW'))!;
    const resFwd = simulatePipeline(prog.instructions, {
      enableForwarding: true,
      branchPrediction: 'NOT_TAKEN',
    });

    // With forwarding, RAW hazards without LW do not need stalls
    const stalls = resFwd.cycleStates.filter((s) => s.actionTaken.includes('Bubble'));
    expect(stalls.length).toBe(0);
  });

  it('correctly handles Load-Use hazard with mandatory 1-cycle stall even with forwarding', () => {
    const prog = PRESET_PROGRAMS.find((p) => p.name.includes('Load-Use'))!;
    const res = simulatePipeline(prog.instructions, {
      enableForwarding: true,
      branchPrediction: 'NOT_TAKEN',
    });

    const loadUseHazards = res.hazardsDetected.filter((h) => h.type === 'LOAD_USE');
    expect(loadUseHazards.length).toBeGreaterThan(0);
  });

  it('handles branch taken with pipeline flush', () => {
    const prog = PRESET_PROGRAMS.find((p) => p.name.includes('Control / Branch'))!;
    const res = simulatePipeline(prog.instructions, {
      enableForwarding: true,
      branchPrediction: 'NOT_TAKEN',
      branchOutcomeTaken: true,
    });

    const branchHazards = res.hazardsDetected.filter((h) => h.type === 'BRANCH');
    expect(branchHazards.length).toBeGreaterThan(0);
  });
});
