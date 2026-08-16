import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  simulateIOTransfer, 
  IOMode, 
  PeripheralDeviceType, 
  IOTransferResult 
} from '../../../engines/io/ioTransfer.ts';
import { ControllerBar } from '../../shell/ControllerBar.tsx';
import { ExplanationCard } from '../../shell/ExplanationCard.tsx';
import { ExportMenu } from '../../shell/ExportMenu.tsx';
import { usePersistentState } from '../../../hooks/usePersistentState.ts';
import { 
  Cpu, 
  HardDrive, 
  Layers, 
  Zap, 
  Clock, 
  Radio, 
  ShieldAlert, 
  Keyboard, 
  Thermometer, 
  Network 
} from 'lucide-react';
import { TimelinePhase } from '../../shell/ScrubberTimeline.tsx';
import { TraceExportData } from '../../../utils/exportTrace.ts';

export const IOTransferSimulator: React.FC = () => {
  const [mode, setMode] = usePersistentState<IOMode>('io_mode', 'INTERRUPT_DRIVEN');
  const [deviceType, setDeviceType] = usePersistentState<PeripheralDeviceType>('io_device', 'KEYBOARD');
  const [deviceLatency, setDeviceLatency] = usePersistentState<number>('io_latency', 3);
  const [dataInput, setDataInput] = usePersistentState<string>('io_input', 'SRM');
  
  // Playback state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Convert input string to byte array
  const dataBytes = useMemo(() => {
    const bytes: number[] = [];
    for (let i = 0; i < (dataInput.length || 1); i++) {
      bytes.push(dataInput.charCodeAt(i) || 0x41);
    }
    return bytes.slice(0, 4); // Limit to 4 bytes for clean visualization
  }, [dataInput]);

  const simulationResult: IOTransferResult = useMemo(() => {
    return simulateIOTransfer({
      mode,
      deviceType,
      dataToTransfer: dataBytes,
      deviceLatencyCycles: deviceLatency,
    });
  }, [mode, deviceType, dataBytes, deviceLatency]);

  const totalSteps = simulationResult.steps.length;
  const currentStep = simulationResult.steps[currentStepIndex] || simulationResult.steps[0];

  // Trace Export Data Object
  const exportData: TraceExportData = useMemo(() => {
    return {
      title: `I/O Transfer Modes Trace (${mode === 'PROGRAMMED_IO' ? 'Programmed I/O Polling' : 'Interrupt-Driven I/O'})`,
      subtitle: `Device: ${deviceType} | Latency: ${deviceLatency} Cycles | Payload: "${dataInput}"`,
      parameters: {
        'Transfer Mode': mode,
        'Peripheral Device': deviceType,
        'Device Latency': `${deviceLatency} clock cycles`,
        'Total Cycles': totalSteps,
        'Productive Cycles': currentStep.productiveCyclesCount,
        'Wasted Polling Cycles': currentStep.wastedCyclesCount,
      },
      columns: [
        { key: 'cycle', header: 'Cycle #' },
        { key: 'phase', header: 'I/O Phase' },
        { key: 'signals', header: 'Signals (INTR/INTA/IOR/MEMW)' },
        { key: 'description', header: 'Operation Description' },
      ],
      rows: simulationResult.steps.map((s) => ({
        cycle: `Cycle ${s.cycle}`,
        phase: s.phase,
        signals: `INTR=${s.signalLines.intr ? '1' : '0'}, INTA=${s.signalLines.inta ? '1' : '0'}, IOR=${s.signalLines.ior ? '1' : '0'}, MEMW=${s.signalLines.memw ? '1' : '0'}`,
        description: s.description,
      })),
      conclusion: `Completed in ${totalSteps} cycles (${currentStep.productiveCyclesCount} productive, ${currentStep.wastedCyclesCount} wasted polling cycles).`,
    };
  }, [mode, deviceType, deviceLatency, dataInput, totalSteps, currentStep, simulationResult]);

  // Phase markers for scrubber timeline
  const timelinePhases: TimelinePhase[] = useMemo(() => {
    return simulationResult.steps.map((s, idx) => ({
      stepIndex: idx,
      label: s.phase === 'POLLING_BUSY_WAIT' ? 'Poll' : s.phase === 'INTERRUPT_TRIGGER' ? 'INTR' : s.phase === 'EXECUTE_ISR' ? 'ISR' : s.phase === 'TRANSFER_BYTE' ? 'Transfer' : `C${s.cycle}`,
      category: s.phase === 'POLLING_BUSY_WAIT' ? 'compute' : s.phase === 'COMPLETE' ? 'result' : 'default',
    }));
  }, [simulationResult]);

  // Reset to first step on mode/config change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [mode, deviceType, deviceLatency, dataBytes]);

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
      {/* Top Configuration & Presets Header */}
      <div className="bg-card-bg border border-border-main rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setMode('PROGRAMMED_IO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'PROGRAMMED_IO'
                  ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-sm font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
              }`}
            >
              Programmed I/O (Polling)
            </button>
            <button
              onClick={() => setMode('INTERRUPT_DRIVEN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'INTERRUPT_DRIVEN'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
              }`}
            >
              Interrupt-Driven I/O
            </button>
          </div>

          {/* Device Selection */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {[
              { id: 'KEYBOARD' as PeripheralDeviceType, label: 'Keyboard', icon: Keyboard },
              { id: 'DISK_SECTOR' as PeripheralDeviceType, label: 'Disk', icon: HardDrive },
              { id: 'TEMP_SENSOR' as PeripheralDeviceType, label: 'Sensor', icon: Thermometer },
              { id: 'NETWORK_NIC' as PeripheralDeviceType, label: 'NIC', icon: Network },
            ].map((dev) => {
              const DevIcon = dev.icon;
              return (
                <button
                  key={dev.id}
                  onClick={() => setDeviceType(dev.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    deviceType === dev.id
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
                  }`}
                >
                  <DevIcon className="w-3.5 h-3.5" />
                  <span>{dev.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Parameters & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <span className="text-xs font-bold text-text-muted">Latency:</span>
            <select
              value={deviceLatency}
              onChange={(e) => setDeviceLatency(Number(e.target.value))}
              className="bg-card-bg border border-border-main text-xs font-bold text-text-heading px-2 py-0.5 rounded-lg focus:outline-none focus:border-accent-primary"
            >
              <option value={1}>1 Cycle (Ultra Fast)</option>
              <option value={3}>3 Cycles (Medium)</option>
              <option value={5}>5 Cycles (Slow Device)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-card-surface px-3 py-1.5 rounded-xl border border-border-main">
            <span className="text-xs font-bold text-text-muted">Data:</span>
            <input
              type="text"
              maxLength={4}
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value || 'A')}
              className="w-16 bg-card-bg border border-border-main text-center text-xs font-bold text-accent-primary px-2 py-0.5 rounded-lg focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Export Menu */}
          <ExportMenu data={exportData} filenamePrefix={`io-transfer-${mode.toLowerCase()}`} />
        </div>
      </div>

      {/* Main Interactive Diagram & Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 8 Cols: Architectural Schematic */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-card-bg border border-border-main rounded-2xl p-5 shadow-sm relative overflow-hidden">
            {/* Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-main mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent-primary animate-pulse" />
                <span className="text-sm font-extrabold text-text-heading uppercase tracking-wider">
                  I/O Subsystem Architecture Diagram
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  currentStep.phase === 'POLLING_BUSY_WAIT'
                    ? 'bg-accent-rose/15 text-accent-rose border-accent-rose/40'
                    : currentStep.phase === 'INTERRUPT_TRIGGER'
                    ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/40'
                    : 'bg-accent-primary/15 text-accent-primary border-accent-primary/40'
                }`}>
                  Phase: {currentStep.phase}
                </span>
              </div>
            </div>

            {/* Architecture Node Grid */}
            <div className="grid grid-cols-3 gap-4 relative">
              {/* CPU Node */}
              <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                currentStep.phase === 'POLLING_BUSY_WAIT'
                  ? 'border-accent-rose/60 bg-accent-rose/5 ring-2 ring-accent-rose/30'
                  : currentStep.phase === 'EXECUTE_ISR'
                  ? 'border-accent-emerald/60 bg-accent-emerald/5 ring-2 ring-accent-emerald/30'
                  : 'bg-card-surface border-border-main'
              }`}>
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-border-main flex items-center justify-center text-accent-primary mb-2 shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-heading">Main CPU Core</h4>
                <span className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded ${
                  currentStep.phase === 'POLLING_BUSY_WAIT'
                    ? 'bg-accent-rose/20 text-accent-rose'
                    : 'bg-accent-emerald/20 text-accent-emerald'
                }`}>
                  {currentStep.phase}
                </span>
                
                <div className="grid grid-cols-2 gap-2 mt-3 w-full text-left font-mono text-[10px]">
                  <div className="bg-card-bg p-1.5 rounded-lg border border-border-main">
                    <span className="text-text-faint block">PC:</span>
                    <span className="font-bold text-accent-primary">0x{currentStep.cpu.pc.toString(16).toUpperCase()}</span>
                  </div>
                  <div className="bg-card-bg p-1.5 rounded-lg border border-border-main">
                    <span className="text-text-faint block">ACC:</span>
                    <span className="font-bold text-accent-amber">0x{currentStep.cpu.acc.toString(16).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* I/O Interface Controller */}
              <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-border-main flex items-center justify-center text-accent-secondary mb-2 shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-heading">I/O Interface</h4>
                <span className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded ${
                  currentStep.ioInterface.status.ready
                    ? 'bg-accent-emerald/20 text-accent-emerald'
                    : 'bg-accent-amber/20 text-accent-amber'
                }`}>
                  Ready Flag F = {currentStep.ioInterface.status.ready ? '1 (Ready)' : '0 (Busy)'}
                </span>

                <div className="grid grid-cols-2 gap-2 mt-3 w-full text-left font-mono text-[10px]">
                  <div className="bg-card-bg p-1.5 rounded-lg border border-border-main">
                    <span className="text-text-faint block">Data Reg:</span>
                    <span className="font-bold text-accent-primary">
                      {currentStep.ioInterface.dataRegister > 0 ? `0x${currentStep.ioInterface.dataRegister.toString(16).toUpperCase()}` : '0x00'}
                    </span>
                  </div>
                  <div className="bg-card-bg p-1.5 rounded-lg border border-border-main">
                    <span className="text-text-faint block">Busy:</span>
                    <span className="font-bold text-text-heading">{currentStep.ioInterface.status.busy ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              </div>

              {/* Peripheral Device */}
              <div className="p-4 rounded-2xl bg-card-surface border border-border-main flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-card-bg border border-border-main flex items-center justify-center text-accent-emerald mb-2 shadow-sm">
                  {deviceType === 'KEYBOARD' ? <Keyboard className="w-5 h-5" /> : deviceType === 'DISK_SECTOR' ? <HardDrive className="w-5 h-5" /> : deviceType === 'TEMP_SENSOR' ? <Thermometer className="w-5 h-5" /> : <Network className="w-5 h-5" />}
                </div>
                <h4 className="font-extrabold text-sm text-text-heading">{deviceType}</h4>
                <span className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded ${
                  currentStep.device.state === 'BUSY_PROCESSING'
                    ? 'bg-accent-amber/20 text-accent-amber'
                    : 'bg-accent-emerald/20 text-accent-emerald'
                }`}>
                  {currentStep.device.state}
                </span>
                
                <div className="text-[11px] text-text-muted mt-2 font-mono">
                  Transferred: {currentStep.transferredBytes.length} / {dataBytes.length} B
                </div>
              </div>
            </div>

            {/* Signal Lines Bus */}
            <div className="mt-5 p-3.5 rounded-xl bg-card-surface border border-border-main flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-amber animate-pulse" />
                <span className="text-xs font-bold text-text-heading">Control Bus Lines</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className={currentStep.signalLines.intr ? 'text-accent-rose font-bold' : 'text-text-faint'}>
                  INTR: {currentStep.signalLines.intr ? '1' : '0'}
                </span>
                <span className={currentStep.signalLines.inta ? 'text-accent-primary font-bold' : 'text-text-faint'}>
                  INTA: {currentStep.signalLines.inta ? '1' : '0'}
                </span>
                <span className={currentStep.signalLines.ior ? 'text-accent-emerald font-bold' : 'text-text-faint'}>
                  IOR: {currentStep.signalLines.ior ? '1' : '0'}
                </span>
                <span className={currentStep.signalLines.memw ? 'text-purple-600 font-bold' : 'text-text-faint'}>
                  MEMW: {currentStep.signalLines.memw ? '1' : '0'}
                </span>
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
            statusText={`I/O Mode: ${mode === 'PROGRAMMED_IO' ? 'Programmed I/O (Polling)' : 'Interrupt-Driven'}`}
          />
        </div>

        {/* Right 4 Cols: Live Explanations & Telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Live Explanation Card */}
          <ExplanationCard
            title={currentStep.title}
            badge={`Cycle ${currentStep.cycle} / ${totalSteps}`}
            badgeColor={
              currentStep.phase === 'POLLING_BUSY_WAIT'
                ? 'rose'
                : currentStep.phase === 'INTERRUPT_TRIGGER'
                ? 'amber'
                : 'cyan'
            }
            actionTaken={currentStep.description}
            explanation={currentStep.explanation}
            subNotes={[
              `Mode: ${mode === 'PROGRAMMED_IO' ? 'Programmed I/O (Polling Loop)' : 'Interrupt-Driven (Asynchronous)'}`,
              `Active Signal Lines: INTR=${currentStep.signalLines.intr ? '1' : '0'}, INTA=${currentStep.signalLines.inta ? '1' : '0'}, IOR=${currentStep.signalLines.ior ? '1' : '0'}, MEMW=${currentStep.signalLines.memw ? '1' : '0'}`
            ]}
          />

          {/* Performance Comparison Panel */}
          <div className="bg-card-bg border border-border-main rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border-main pb-3">
              <Clock className="w-5 h-5 text-accent-primary" />
              <h3 className="font-extrabold text-sm text-text-heading">CPU Efficiency Telemetry</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-card-surface p-3 rounded-xl border border-border-main">
                <span className="text-text-muted block text-[11px] font-bold">Productive Cycles</span>
                <span className="text-lg font-black text-accent-emerald font-mono">
                  {currentStep.productiveCyclesCount}
                </span>
              </div>
              <div className="bg-card-surface p-3 rounded-xl border border-border-main">
                <span className="text-text-muted block text-[11px] font-bold">Wasted Polling Cycles</span>
                <span className="text-lg font-black text-accent-rose font-mono">
                  {currentStep.wastedCyclesCount}
                </span>
              </div>
            </div>

            {/* Efficiency Progress Bar */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-muted">CPU Utilization Efficiency</span>
                <span className={mode === 'INTERRUPT_DRIVEN' ? 'text-accent-primary font-extrabold' : 'text-accent-amber font-extrabold'}>
                  {((currentStep.productiveCyclesCount / (currentStep.cycle || 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-card-surface rounded-full overflow-hidden border border-border-main">
                <div 
                  className={`h-full transition-all duration-300 ${
                    mode === 'INTERRUPT_DRIVEN'
                      ? 'bg-gradient-to-r from-accent-primary to-accent-emerald'
                      : 'bg-gradient-to-r from-accent-amber to-accent-rose'
                  }`}
                  style={{ width: `${(currentStep.productiveCyclesCount / (currentStep.cycle || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Smartboard Key Takeaways */}
            <div className="p-3.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-xs text-text-body flex flex-col gap-1.5">
              <span className="font-extrabold text-accent-primary flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Classroom Key Takeaway
              </span>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {mode === 'PROGRAMMED_IO'
                  ? 'Programmed I/O wastes CPU clock cycles in tight polling loops. Suitable only for dedicated low-overhead microcontroller loops.'
                  : 'Interrupt-Driven I/O enables complete hardware concurrency. The CPU performs user tasks uninterrupted until notified by the hardware INTR pin.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
