import { describe, it, expect } from 'vitest';
import { 
  simulateHardwiredCU, 
  simulateMicroprogrammedCU, 
  MICRO_ROM,
  HardwiredStep,
  MicroprogrammedStep
} from './controlUnit.ts';

describe('Control Unit Simulation Engine', () => {
  it('simulates Hardwired CU for direct ADD instruction', () => {
    const res = simulateHardwiredCU('ADD', false);
    expect(res.mode).toBe('HARDWIRED');
    expect(res.steps.length).toBe(6); // T0, T1, T2, T3, T4, T5
    const steps = res.steps as HardwiredStep[];
    expect(steps[0].timingSignal).toBe('T0');
    expect(steps[1].timingSignal).toBe('T1');
    expect(steps[5].timingSignal).toBe('T5');
    expect(steps[5].isSCReset).toBe(true);
  });

  it('simulates Hardwired CU for indirect ADD instruction with extra EA fetch cycle', () => {
    const res = simulateHardwiredCU('ADD', true);
    expect(res.isIndirect).toBe(true);
    expect(res.steps[3].description).toContain('Indirect');
  });

  it('simulates Microprogrammed CU for direct ADD micro-routine', () => {
    const res = simulateMicroprogrammedCU('ADD', false);
    expect(res.mode).toBe('MICROPROGRAMMED');
    const steps = res.steps as MicroprogrammedStep[];
    expect(steps[0].car).toBe(0);
    expect(steps[1].car).toBe(1);
    expect(steps[2].car).toBe(2);
    // mapped to ADD (10)
    expect(steps[3].car).toBe(10);
    expect(steps[4].car).toBe(11);
    expect(steps[4].nextCar).toBe(0); // return to fetch
  });

  it('simulates Microprogrammed CU for indirect LDA micro-routine', () => {
    const res = simulateMicroprogrammedCU('LDA', true);
    const steps = res.steps as MicroprogrammedStep[];
    expect(steps[2].nextCar).toBe(4); // jumps to INDIR routine at 4
    expect(steps[3].car).toBe(4);
    expect(steps[4].car).toBe(5);
  });

  it('verifies Micro ROM consistency', () => {
    expect(MICRO_ROM.length).toBeGreaterThanOrEqual(10);
    const fetch0 = MICRO_ROM.find((m) => m.address === 0);
    expect(fetch0).toBeDefined();
    expect(fetch0?.f2_bus).toBe('MAR_PC');
  });
});
