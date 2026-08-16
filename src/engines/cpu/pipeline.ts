export type PipelineStage = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';

export interface Instruction {
  id: number;
  label?: string;
  opcode: 'ADD' | 'SUB' | 'AND' | 'OR' | 'SLT' | 'LW' | 'SW' | 'BEQ' | 'NOP';
  destReg?: string; // e.g. 'R1', 'R2'
  srcReg1?: string; // e.g. 'R2'
  srcReg2?: string; // e.g. 'R3'
  immediate?: number; // for LW, SW, BEQ offset
  targetLabel?: string; // for BEQ target
  rawText: string;
}

export type HazardType = 'RAW' | 'WAR' | 'WAW' | 'LOAD_USE' | 'BRANCH' | 'NONE';

export interface HazardAlert {
  cycle: number;
  type: HazardType;
  description: string;
  producerInstId: number;
  consumerInstId: number;
  register?: string;
  resolvedBy: 'FORWARDING' | 'STALL' | 'FLUSH' | 'NONE';
}

export interface StageSlot {
  instructionId: number;
  stage: PipelineStage | 'STALL' | 'FLUSH';
  isBubble?: boolean;
  isFlushed?: boolean;
  forwardingFrom?: {
    stage: 'EX' | 'MEM';
    register: string;
    targetStage: 'EX' | 'MEM';
  };
}

export interface PipelineCycleState {
  cycle: number;
  // Reservation table row: map instructionId -> StageSlot | null
  instructionStages: Record<number, StageSlot | null>;
  // Active stage slots in this cycle
  IF: Instruction | null;
  ID: Instruction | null;
  EX: Instruction | null;
  MEM: Instruction | null;
  WB: Instruction | null;
  hazards: HazardAlert[];
  explanation: string;
  actionTaken: string;
  forwardingEvents: string[];
}

export interface PipelineSimulationResult {
  totalCycles: number;
  instructions: Instruction[];
  cycleStates: PipelineCycleState[];
  reservationTable: {
    instruction: Instruction;
    slots: (StageSlot | null)[]; // index is cycle (0-based)
  }[];
  hazardsDetected: HazardAlert[];
  cpi: number;
  speedup: number;
}

export interface PipelineConfig {
  enableForwarding: boolean;
  branchPrediction: 'NOT_TAKEN' | 'TAKEN';
  branchOutcomeTaken?: boolean; // whether BEQ branch condition evaluates to true
}

export const PRESET_PROGRAMS: { name: string; description: string; instructions: Instruction[]; branchTaken?: boolean }[] = [
  {
    name: 'RAW Data Hazard (Arithmetic Dependency)',
    description: 'Demonstrates Read-After-Write data dependency on R1 between ADD and subsequent SUB/AND instructions.',
    instructions: [
      { id: 1, opcode: 'ADD', destReg: 'R1', srcReg1: 'R2', srcReg2: 'R3', rawText: 'ADD R1, R2, R3' },
      { id: 2, opcode: 'SUB', destReg: 'R4', srcReg1: 'R1', srcReg2: 'R5', rawText: 'SUB R4, R1, R5' },
      { id: 3, opcode: 'AND', destReg: 'R6', srcReg1: 'R1', srcReg2: 'R7', rawText: 'AND R6, R1, R7' },
      { id: 4, opcode: 'OR',  destReg: 'R8', srcReg1: 'R9', srcReg2: 'R10', rawText: 'OR R8, R9, R10' },
    ],
  },
  {
    name: 'Load-Use Hazard (Requires Stall even with Forwarding)',
    description: 'Demonstrates Load-Use data dependency where data is only available after MEM stage, requiring 1 stall cycle.',
    instructions: [
      { id: 1, opcode: 'LW',  destReg: 'R1', srcReg1: 'R2', immediate: 0, rawText: 'LW R1, 0(R2)' },
      { id: 2, opcode: 'ADD', destReg: 'R3', srcReg1: 'R1', srcReg2: 'R4', rawText: 'ADD R3, R1, R4' },
      { id: 3, opcode: 'SUB', destReg: 'R5', srcReg1: 'R6', srcReg2: 'R7', rawText: 'SUB R5, R6, R7' },
      { id: 4, opcode: 'SW',  destReg: 'R3', srcReg1: 'R8', immediate: 4, rawText: 'SW R3, 4(R8)' },
    ],
  },
  {
    name: 'Control / Branch Hazard (BEQ Branch Penalty)',
    description: 'Demonstrates branch resolution in EX stage leading to branch penalty / pipeline flushes if branch is Taken.',
    instructions: [
      { id: 1, opcode: 'ADD', destReg: 'R1', srcReg1: 'R2', srcReg2: 'R3', rawText: 'ADD R1, R2, R3' },
      { id: 2, opcode: 'BEQ', srcReg1: 'R1', srcReg2: 'R0', targetLabel: 'TARGET', rawText: 'BEQ R1, R0, TARGET' },
      { id: 3, opcode: 'SUB', destReg: 'R4', srcReg1: 'R5', srcReg2: 'R6', rawText: 'SUB R4, R5, R6 (Flushed if Taken)' },
      { id: 4, opcode: 'AND', destReg: 'R7', srcReg1: 'R8', srcReg2: 'R9', rawText: 'AND R7, R8, R9 (Flushed if Taken)' },
      { id: 5, opcode: 'OR',  destReg: 'R10', srcReg1: 'R11', srcReg2: 'R12', label: 'TARGET', rawText: 'TARGET: OR R10, R11, R12' },
    ],
    branchTaken: true,
  },
  {
    name: 'Independent Instructions (Ideal Pipeline)',
    description: 'Demonstrates ideal 5-stage throughput (1 instruction completed per cycle after pipeline fills, CPI ≈ 1.0).',
    instructions: [
      { id: 1, opcode: 'ADD', destReg: 'R1', srcReg1: 'R2', srcReg2: 'R3', rawText: 'ADD R1, R2, R3' },
      { id: 2, opcode: 'SUB', destReg: 'R4', srcReg1: 'R5', srcReg2: 'R6', rawText: 'SUB R4, R5, R6' },
      { id: 3, opcode: 'AND', destReg: 'R7', srcReg1: 'R8', srcReg2: 'R9', rawText: 'AND R7, R8, R9' },
      { id: 4, opcode: 'OR',  destReg: 'R10', srcReg1: 'R11', srcReg2: 'R12', rawText: 'OR R10, R11, R12' },
      { id: 5, opcode: 'SLT', destReg: 'R13', srcReg1: 'R14', srcReg2: 'R15', rawText: 'SLT R13, R14, R15' },
    ],
  },
];

export function simulatePipeline(
  instructions: Instruction[],
  config: PipelineConfig
): PipelineSimulationResult {
  const { enableForwarding, branchOutcomeTaken = false } = config;
  const cycleStates: PipelineCycleState[] = [];
  const allHazards: HazardAlert[] = [];

  let ifInst: Instruction | null = instructions.length > 0 ? instructions[0] : null;
  let idInst: Instruction | null = null;
  let exInst: Instruction | null = null;
  let memInst: Instruction | null = null;
  let wbInst: Instruction | null = null;

  let pc = instructions.length > 0 ? 1 : 0; // next instruction index pointer
  let cycle = 1;
  const maxCycles = 40;

  // Track per-instruction stage placement over time
  // reservation: map instructionId -> array of stage strings
  const reservation: Record<number, (StageSlot | null)[]> = {};
  instructions.forEach((inst) => {
    reservation[inst.id] = [];
  });

  while (cycle <= maxCycles) {
    const cycleHazards: HazardAlert[] = [];
    const forwardingEvents: string[] = [];
    let isStall = false;
    let isFlush = false;

    // Check for Load-Use Hazard in ID stage
    if (idInst && exInst && exInst.opcode === 'LW') {
      const src1Match = idInst.srcReg1 && idInst.srcReg1 === exInst.destReg;
      const src2Match = idInst.srcReg2 && idInst.srcReg2 === exInst.destReg && idInst.opcode !== 'SW';
      if (src1Match || src2Match) {
        // Load-Use hazard: 1 stall cycle is mandatory even with forwarding
        isStall = true;
        const hazard: HazardAlert = {
          cycle,
          type: 'LOAD_USE',
          description: `Load-Use Hazard: Inst ${idInst.id} (${idInst.rawText}) needs ${exInst.destReg} produced by LW in EX stage.`,
          producerInstId: exInst.id,
          consumerInstId: idInst.id,
          register: exInst.destReg,
          resolvedBy: 'STALL',
        };
        cycleHazards.push(hazard);
        allHazards.push(hazard);
      }
    }

    // Check for RAW Data Hazard in ID stage if forwarding is disabled
    if (!enableForwarding && idInst) {
      // Check EX stage producer
      if (exInst && exInst.destReg && (idInst.srcReg1 === exInst.destReg || (idInst.srcReg2 === exInst.destReg && idInst.opcode !== 'SW'))) {
        isStall = true;
        const hazard: HazardAlert = {
          cycle,
          type: 'RAW',
          description: `RAW Data Hazard: Inst ${idInst.id} needs ${exInst.destReg} from Inst ${exInst.id} (currently in EX). Stall inserted.`,
          producerInstId: exInst.id,
          consumerInstId: idInst.id,
          register: exInst.destReg,
          resolvedBy: 'STALL',
        };
        cycleHazards.push(hazard);
        allHazards.push(hazard);
      }
      // Check MEM stage producer
      else if (memInst && memInst.destReg && (idInst.srcReg1 === memInst.destReg || (idInst.srcReg2 === memInst.destReg && idInst.opcode !== 'SW'))) {
        isStall = true;
        const hazard: HazardAlert = {
          cycle,
          type: 'RAW',
          description: `RAW Data Hazard: Inst ${idInst.id} needs ${memInst.destReg} from Inst ${memInst.id} (currently in MEM). Stall inserted.`,
          producerInstId: memInst.id,
          consumerInstId: idInst.id,
          register: memInst.destReg,
          resolvedBy: 'STALL',
        };
        cycleHazards.push(hazard);
        allHazards.push(hazard);
      }
    }

    // Check for Data Forwarding if enabled (in EX stage)
    if (enableForwarding && exInst) {
      // Forward from MEM to EX
      if (memInst && memInst.destReg && memInst.opcode !== 'SW') {
        if (exInst.srcReg1 === memInst.destReg) {
          forwardingEvents.push(`EX/MEM.RegisterRd (${memInst.destReg}) ➔ ALU Input A (Inst ${exInst.id})`);
        }
        if (exInst.srcReg2 === memInst.destReg && exInst.opcode !== 'SW' && exInst.opcode !== 'LW') {
          forwardingEvents.push(`EX/MEM.RegisterRd (${memInst.destReg}) ➔ ALU Input B (Inst ${exInst.id})`);
        }
      }
      // Forward from WB to EX
      if (wbInst && wbInst.destReg && wbInst.opcode !== 'SW') {
        if (exInst.srcReg1 === wbInst.destReg && (!memInst || memInst.destReg !== wbInst.destReg)) {
          forwardingEvents.push(`MEM/WB.RegisterRd (${wbInst.destReg}) ➔ ALU Input A (Inst ${exInst.id})`);
        }
        if (exInst.srcReg2 === wbInst.destReg && (!memInst || memInst.destReg !== wbInst.destReg) && exInst.opcode !== 'SW' && exInst.opcode !== 'LW') {
          forwardingEvents.push(`MEM/WB.RegisterRd (${wbInst.destReg}) ➔ ALU Input B (Inst ${exInst.id})`);
        }
      }
    }

    // Check for Branch Hazard in EX stage
    if (exInst && exInst.opcode === 'BEQ') {
      if (branchOutcomeTaken) {
        // Branch is taken: flush instructions in IF and ID
        isFlush = true;
        const hazard: HazardAlert = {
          cycle,
          type: 'BRANCH',
          description: `Control Hazard: Branch BEQ (Inst ${exInst.id}) taken. Flushed speculative instructions in IF & ID.`,
          producerInstId: exInst.id,
          consumerInstId: idInst?.id || 0,
          resolvedBy: 'FLUSH',
        };
        cycleHazards.push(hazard);
        allHazards.push(hazard);
      }
    }

    // Snapshot current cycle stage slots
    const instructionStages: Record<number, StageSlot | null> = {};
    instructions.forEach((i) => (instructionStages[i.id] = null));

    if (wbInst) instructionStages[wbInst.id] = { instructionId: wbInst.id, stage: 'WB' };
    if (memInst) instructionStages[memInst.id] = { instructionId: memInst.id, stage: 'MEM' };
    if (exInst) instructionStages[exInst.id] = { instructionId: exInst.id, stage: 'EX' };
    if (idInst) instructionStages[idInst.id] = { instructionId: idInst.id, stage: 'ID' };
    if (ifInst) instructionStages[ifInst.id] = { instructionId: ifInst.id, stage: 'IF' };

    // Record in reservation matrix
    instructions.forEach((inst) => {
      reservation[inst.id].push(instructionStages[inst.id]);
    });

    let explanation = `Clock Cycle ${cycle}: `;
    let actionTaken = '';

    if (isStall) {
      explanation += `Pipeline stalled due to data dependency on register. A bubble is inserted into the EX stage.`;
      actionTaken = `Bubble inserted in EX; IF/ID registers hold state.`;
    } else if (isFlush) {
      explanation += `Branch condition satisfied (Taken). Speculative instructions flushed from IF/ID stages.`;
      actionTaken = `Flushed IF/ID pipeline registers; redirecting PC to branch target.`;
    } else {
      const activeOps = [
        ifInst ? `IF: Inst ${ifInst.id}` : null,
        idInst ? `ID: Inst ${idInst.id}` : null,
        exInst ? `EX: Inst ${exInst.id}` : null,
        memInst ? `MEM: Inst ${memInst.id}` : null,
        wbInst ? `WB: Inst ${wbInst.id}` : null,
      ].filter(Boolean).join(' | ');

      explanation += activeOps.length > 0 ? activeOps : 'Pipeline completing remaining operations.';
      actionTaken = forwardingEvents.length > 0 
        ? `Data bypassed: ${forwardingEvents.join('; ')}`
        : 'All stages advancing normally (1 step).';
    }

    cycleStates.push({
      cycle,
      instructionStages,
      IF: ifInst,
      ID: idInst,
      EX: exInst,
      MEM: memInst,
      WB: wbInst,
      hazards: cycleHazards,
      explanation,
      actionTaken,
      forwardingEvents,
    });

    // Advance pipeline stages for next cycle
    // 1. WB stage finishes
    wbInst = memInst;

    // 2. MEM stage receives from EX
    memInst = exInst;

    // 3. EX stage handling (Stall or normal or flush)
    if (isStall) {
      exInst = null; // bubble inserted
      // ID and IF stay unchanged (stalled)
    } else if (isFlush) {
      exInst = null;
      idInst = null; // flush
      ifInst = null; // flush
      // jump PC to branch target (find target label if any)
      const targetIdx = instructions.findIndex((inst) => inst.label === 'TARGET');
      if (targetIdx !== -1) {
        pc = targetIdx;
      }
    } else {
      exInst = idInst;
      idInst = ifInst;
      if (pc < instructions.length) {
        ifInst = instructions[pc];
        pc++;
      } else {
        ifInst = null;
      }
    }

    // Check termination condition: all stages empty and all instructions fetched
    if (!ifInst && !idInst && !exInst && !memInst && !wbInst && pc >= instructions.length) {
      break;
    }

    cycle++;
  }

  const totalCycles = cycleStates.length;
  const numInst = instructions.length;
  const cpi = Number((totalCycles / Math.max(1, numInst)).toFixed(2));
  const unpipelinedCycles = numInst * 5;
  const speedup = Number((unpipelinedCycles / Math.max(1, totalCycles)).toFixed(2));

  const reservationTable = instructions.map((inst) => ({
    instruction: inst,
    slots: reservation[inst.id] || [],
  }));

  return {
    totalCycles,
    instructions,
    cycleStates,
    reservationTable,
    hazardsDetected: allHazards,
    cpi,
    speedup,
  };
}
