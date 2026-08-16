import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  simulateDMA, 
  DMAMode, 
  DMATransferDirection, 
  DMAResult 
} from '../../../engines/io/dmaController.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { 
  Cpu, 
  HardDrive, 
  Layers, 
  Zap, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Disc, 
  Radio, 
  ArrowRightLeft 
} from 'lucide-react';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const DMASimulator: React.FC = () => {
  const [mode, setMode] = usePersistentState<DMAMode>('dma_mode', 'BURST_MODE');
  const [direction, setDirection] = usePersistentState<DMATransferDirection>('dma_dir', 'DEVICE_TO_MEMORY');
  const [channel, setChannel] = usePersistentState<number>('dma_chan', 1);
  const [textPayload, setTextPayload] = usePersistentState<string>('dma_payload', 'SRM');
  const [startAddress] = useState<number>(0x4000);

  // Playback state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Convert text to byte array
  const dataBytes = useMemo(() => {
    const bytes: number[] = [];
    for (let i = 0; i < (textPayload.length || 1); i++) {
      bytes.push(textPayload.charCodeAt(i) || 0x41);
    }
    return bytes.slice(0, 5); // Max 5 bytes for clear diagram
  }, [textPayload]);

  const simulationResult: DMAResult = useMemo(() => {
    return simulateDMA({
      mode,
      direction,
      startAddress,
      dataPayload: dataBytes,
      channel,
    });
  }, [mode, direction, startAddress, dataBytes, channel]);

  const totalSteps = simulationResult.steps.length;
  const currentStep = simulationResult.steps[currentStepIndex] || simulationResult.steps[0];

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    return {
      title: `Direct Memory Access (DMA 8237) Bus Arbitration Trace`,
      subtitle: `Mode: ${mode} | Direction: ${direction} | Channel: ${channel} | Payload: "${textPayload}"`,
      parameters: {
        'DMA Mode': mode,
        'Direction': direction,
        'DMA Channel': `Channel ${channel}`,
        'Payload Bytes': dataBytes.length,
        'Base Address': `0x${startAddress.toString(16).toUpperCase()}`,
        'Throughput Saved': `+${simulationResult.efficiencyGainPercentage}% Bus Free`,
      },
      columns: [
        { key: 'step', header: 'Step #' },
        { key: 'phase', header: 'Phase' },
        { key: 'busMaster', header: 'Bus Master' },
        { key: 'signals', header: 'Signals (HRQ/HLDA/DACK/TC)' },
        { key: 'mar', header: 'DMA MAR' },
        { key: 'wcr', header: 'Word Count' },
        { key: 'description', header: 'Action Description' },
      ],
      rows: simulationResult.steps.map((s) => ({
        step: s.stepIndex + 1,
        phase: s.phase,
        busMaster: s.busMaster,
        signals: `HRQ=${s.signals.hrq ? '1' : '0'}, HLDA=${s.signals.hlda ? '1' : '0'}, DACK=${s.signals.dack ? '1' : '0'}, TC=${s.signals.tc ? '1' : '0'}`,
        mar: `0x${s.dma.memoryAddress.toString(16).toUpperCase()}`,
        wcr: s.dma.wordCount,
        description: s.description,
      })),
      conclusion: `DMA transfer completed in ${totalSteps} cycles with +${simulationResult.efficiencyGainPercentage}% CPU bandwidth efficiency gain.`,
    };
  }, [mode, direction, channel, textPayload, dataBytes, startAddress, simulationResult, totalSteps]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return simulationResult.steps.map((s, idx) => ({
      stepIndex: idx,
      label: s.phase === 'IDLE_INIT' ? 'Init' : s.phase === 'DMA_HOLD_REQUEST' ? 'HOLD' : s.phase === 'TRANSFER_DATA_BYTE' ? 'Transfer' : s.phase === 'TERMINAL_COUNT_DONE' ? 'TC' : s.phase,
      category: s.busMaster === 'DMA_CONTROLLER' ? 'compute' : 'default',
    }));
  }, [simulationResult]);

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [mode, direction, channel, dataBytes]);

  // Autoplay ticker
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      const intervalMs = Math.max(250, 1200 / speed);
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speed, totalSteps]);

  const handleStepForward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const handleStepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const handleSeek = useCallback((stepIdx: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(totalSteps - 1, stepIdx)));
  }, [totalSteps]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-card-surface p-1 rounded-xl border border-border-main">
            <button
              onClick={() => setMode('BURST_MODE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'BURST_MODE'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-heading hover:bg-card-subtle'
              }`}
            >
              Burst Mode
            </button>
            <button
              onClick={() => setMode('CYCLE_STEALING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'CYCLE_STEALING'
                  ? 'bg-accent-amber text-slate-950 font-black shadow-sm'
                  : 'text-text-muted hover:text-text-heading hover:bg-card-subtle'
              }`}
            >
              Cycle Stealing
            </button>
          </div>

          {/* Direction */}
          <div className="flex items-center gap-1.5 bg-card-surface p-1 rounded-xl border border-border-main">
            <ArrowRightLeft className="w-3.5 h-3.5 text-accent-emerald ml-1.5" />
            <button
              onClick={() => setDirection('DEVICE_TO_MEMORY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                direction === 'DEVICE_TO_MEMORY'
                  ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40 font-black'
                  : 'text-text-muted hover:text-text-heading'
              }`}
            >
              Device ➔ RAM
            </button>
            <button
              onClick={() => setDirection('MEMORY_TO_DEVICE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                direction === 'MEMORY_TO_DEVICE'
                  ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40 font-black'
                  : 'text-text-muted hover:text-text-heading'
              }`}
            >
              RAM ➔ Device
            </button>
          </div>
        </div>

        {/* Channel & Input Payload & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <span className="text-xs font-bold text-text-muted">Channel:</span>
            <select
              value={channel}
              onChange={(e) => setChannel(Number(e.target.value))}
              className="bg-card-bg border border-border-main text-xs font-bold text-text-heading px-2 py-0.5 rounded-lg focus:outline-none focus:border-accent-primary"
            >
              <option value={0}>Ch 0 (DRAM Refresh)</option>
              <option value={1}>Ch 1 (Disk / SSD)</option>
              <option value={2}>Ch 2 (Flash)</option>
              <option value={3}>Ch 3 (Network NIC)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <span className="text-xs font-bold text-text-muted">Payload:</span>
            <input
              type="text"
              maxLength={5}
              value={textPayload}
              onChange={(e) => setTextPayload(e.target.value || 'A')}
              className="w-16 bg-card-bg border border-border-main text-center text-xs font-bold text-accent-primary px-2 py-0.5 rounded-lg focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix={`dma-${mode.toLowerCase()}`} />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 8 Cols: Architectural Block Diagram */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-card-bg border border-border-main rounded-2xl p-5 shadow-sm relative overflow-hidden">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-border-main mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-primary animate-pulse" />
                <span className="text-sm font-extrabold text-text-heading uppercase tracking-wider">
                  Intel 8237 DMA Bus Master & Arbitration Diagram
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  currentStep.busMaster === 'DMA_CONTROLLER'
                    ? 'bg-accent-primary/15 text-accent-primary border-accent-primary/40'
                    : 'bg-accent-amber/15 text-accent-amber border-accent-amber/40'
                }`}>
                  Current Bus Master: {currentStep.busMaster === 'DMA_CONTROLLER' ? 'DMA Controller (8237)' : 'CPU Processor'}
                </span>
              </div>
            </div>

            {/* Architecture Node Blocks Grid */}
            <div className="grid grid-cols-3 gap-4 relative">
              {/* CPU Node */}
              <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                currentStep.cpuActivity === 'BUS_ISOLATED_WAIT'
                  ? 'border-accent-amber/50 bg-accent-amber/5 ring-1 ring-accent-amber/30'
                  : currentStep.busMaster === 'CPU'
                  ? 'border-accent-primary/50 bg-accent-primary/5 shadow-md'
                  : 'bg-card-surface border-border-main'
              }`}>
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-border-main flex items-center justify-center text-accent-primary mb-2 shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-heading">Main CPU (Host)</h4>
                <span className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded ${
                  currentStep.cpuActivity === 'BUS_ISOLATED_WAIT'
                    ? 'bg-accent-amber/20 text-accent-amber'
                    : 'bg-card-surface text-text-muted'
                }`}>
                  Activity: {currentStep.cpuActivity}
                </span>
                <div className="text-[11px] text-text-muted mt-2">
                  Tri-stated Bus: {currentStep.signals.hlda ? 'YES (Floated)' : 'NO (Active)'}
                </div>
              </div>

              {/* DMA Controller Node */}
              <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                currentStep.busMaster === 'DMA_CONTROLLER'
                  ? 'border-accent-primary bg-accent-primary/10 shadow-lg ring-2 ring-accent-primary/30 scale-105'
                  : 'bg-card-surface border-border-main'
              }`}>
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-border-main flex items-center justify-center text-accent-secondary mb-2 shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-heading">8237 DMA Controller</h4>
                <span className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded ${
                  currentStep.busMaster === 'DMA_CONTROLLER'
                    ? 'bg-accent-primary text-white'
                    : 'bg-card-surface text-text-muted'
                }`}>
                  Channel #{channel} Active
                </span>
                
                <div className="grid grid-cols-2 gap-2 mt-3 w-full text-left font-mono text-[10px]">
                  <div className="bg-card-bg p-1.5 rounded-lg border border-border-main">
                    <span className="text-text-faint block">MAR:</span>
                    <span className="font-bold text-accent-primary">0x{currentStep.dma.memoryAddress.toString(16).toUpperCase()}</span>
                  </div>
                  <div className="bg-card-bg p-1.5 rounded-lg border border-border-main">
                    <span className="text-text-faint block">Count:</span>
                    <span className="font-bold text-accent-emerald">{currentStep.dma.wordCount}</span>
                  </div>
                </div>
              </div>

              {/* I/O Peripheral Device */}
              <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-border-main flex items-center justify-center text-accent-emerald mb-2 shadow-sm">
                  {channel === 1 ? <Disc className="w-5 h-5" /> : channel === 3 ? <Radio className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
                </div>
                <h4 className="font-extrabold text-sm text-text-heading">
                  {channel === 1 ? 'NVMe SSD / HDD' : channel === 3 ? 'Ethernet NIC' : 'I/O Device'}
                </h4>
                <span className="text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded bg-accent-emerald/15 text-accent-emerald">
                  DREQ={currentStep.signals.dreq ? '1' : '0'} | DACK={currentStep.signals.dack ? '1' : '0'}
                </span>
                <div className="text-[11px] text-text-muted mt-2 font-mono">
                  Buffer: "{textPayload}"
                </div>
              </div>
            </div>

            {/* Shared Common System Bus */}
            <div className="mt-5 p-3.5 rounded-xl bg-card-surface border border-border-main flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-amber animate-pulse" />
                <span className="text-xs font-bold text-text-heading">Shared System Bus (Address, Data & Control)</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-text-muted">Active Stream: <strong className="text-accent-primary">{currentStep.buses.dataBus || 'IDLE'}</strong></span>
              </div>
            </div>

            {/* Target RAM Memory Window */}
            <div className="mt-4 p-4 rounded-2xl bg-card-surface border border-border-main">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-heading flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-accent-primary" /> Target RAM Memory (Base: 0x{startAddress.toString(16).toUpperCase()})
                </span>
                <span className="text-[10px] font-mono text-text-muted">4KB Buffer Window</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {currentStep.memoryGrid.map((cell) => {
                  const isCurrentTarget = cell.address === currentStep.dma.memoryAddress;
                  return (
                    <div
                      key={cell.address}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isCurrentTarget
                          ? 'border-accent-primary bg-accent-primary/20 ring-2 ring-accent-primary/50 scale-105'
                          : cell.isModified || cell.value > 0
                          ? 'bg-accent-emerald/10 border-accent-emerald/40'
                          : 'bg-card-bg border-border-main'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-text-faint block">
                        0x{cell.address.toString(16).toUpperCase()}
                      </span>
                      <span className={`text-xs font-mono font-bold block mt-1 ${
                        cell.value > 0 ? 'text-accent-emerald' : 'text-text-faint'
                      }`}>
                        0x{cell.value.toString(16).toUpperCase().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-text-muted block font-mono font-bold">
                        {cell.value > 0 ? `'${String.fromCharCode(cell.value)}'` : '--'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Universal Controller Bar */}
          <ControllerBar
            currentStep={currentStepIndex}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onReset={handleReset}
            onJumpToStart={handleReset}
            onJumpToEnd={() => handleSeek(totalSteps - 1)}
            onSeekStep={handleSeek}
            phases={timelinePhases}
            speed={speed}
            onChangeSpeed={setSpeed}
            statusText={`DMA Controller: ${currentStep.title}`}
          />
        </div>

        {/* Right 4 Cols: Live Explanations & Telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Live Explanation Card */}
          <ExplanationCard
            title={currentStep.title}
            badge={
              currentStep.busMaster === 'DMA_CONTROLLER'
                ? 'DMA BUS MASTER (Direct Streaming)'
                : 'CPU BUS MASTER (Arbitration / Setup)'
            }
            badgeColor={currentStep.busMaster === 'DMA_CONTROLLER' ? 'cyan' : 'amber'}
            actionTaken={currentStep.description}
            explanation={currentStep.explanation}
            formula={`MAR: 0x${currentStep.dma.memoryAddress.toString(16).toUpperCase()} | WCR: ${currentStep.dma.wordCount} | Direction: ${direction}`}
            subNotes={[
              `Mode: ${mode === 'BURST_MODE' ? 'Burst (Continuous Block Ownership)' : 'Cycle Stealing (1 Cycle/Byte Interleaving)'}`,
              `Control Signals: HRQ=${currentStep.signals.hrq ? '1' : '0'}, HLDA=${currentStep.signals.hlda ? '1' : '0'}, DACK=${currentStep.signals.dack ? '1' : '0'}, TC=${currentStep.signals.tc ? '1' : '0'}`
            ]}
          />

          {/* DMA Performance Telemetry Card */}
          <div className="bg-card-bg border border-border-main rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border-main pb-3">
              <Clock className="w-5 h-5 text-accent-primary" />
              <h3 className="font-extrabold text-sm text-text-heading">DMA Throughput Telemetry</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-card-surface p-3 rounded-xl border border-border-main">
                <span className="text-text-muted block text-[11px] font-bold">DMA Transfer Cycles</span>
                <span className="text-lg font-black text-accent-primary font-mono">
                  {currentStep.transferredBytes.length} Cycles
                </span>
              </div>
              <div className="bg-card-surface p-3 rounded-xl border border-border-main">
                <span className="text-text-muted block text-[11px] font-bold">Bus Bandwidth Saved</span>
                <span className="text-lg font-black text-accent-emerald font-mono">
                  +{simulationResult.efficiencyGainPercentage}%
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-xs text-text-body flex flex-col gap-1.5">
              <span className="font-extrabold text-accent-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Bus Arbitration Principle
              </span>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {mode === 'BURST_MODE'
                  ? 'Burst Mode monopolizes the bus until the entire block transfer completes. It delivers maximum I/O throughput for bulk disk/SSD transfers.'
                  : 'Cycle Stealing Mode steals 1 clock cycle per byte, giving the bus back to the CPU between transfers. CPU instructions run with almost zero perceived interruption.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
