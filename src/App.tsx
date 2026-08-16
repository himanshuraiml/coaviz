import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Header, SimulatorTab } from './components/shell/Header.tsx';
import { WhiteboardOverlay } from './components/shell/WhiteboardOverlay.tsx';
import { HelpModal } from './components/shell/HelpModal.tsx';
import { KeyboardShortcutsModal } from './components/shell/KeyboardShortcutsModal.tsx';
import { ErrorBoundary } from './components/shell/ErrorBoundary.tsx';
import { UpdateBanner } from './components/shell/UpdateBanner.tsx';
import { usePersistentState } from './hooks/usePersistentState.ts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.ts';
import { Cpu, Loader2 } from 'lucide-react';

// Lazy-Loaded Unit 1 Simulators
const BoothSimulator = lazy(() =>
  import('./components/simulators/booth/BoothSimulator.tsx').then((m) => ({ default: m.BoothSimulator }))
);
const IEEE754Simulator = lazy(() =>
  import('./components/simulators/ieee754/IEEE754Simulator.tsx').then((m) => ({ default: m.IEEE754Simulator }))
);
const DivisionSimulator = lazy(() =>
  import('./components/simulators/division/DivisionSimulator.tsx').then((m) => ({ default: m.DivisionSimulator }))
);
const NumberSystemSandbox = lazy(() =>
  import('./components/simulators/numberSystem/NumberSystemSandbox.tsx').then((m) => ({ default: m.NumberSystemSandbox }))
);

// Lazy-Loaded Unit 2 Simulators
const VonNeumannSimulator = lazy(() =>
  import('./components/simulators/vonNeumann/VonNeumannSimulator.tsx').then((m) => ({ default: m.VonNeumannSimulator }))
);
const DatapathSimulator = lazy(() =>
  import('./components/simulators/datapath/DatapathSimulator.tsx').then((m) => ({ default: m.DatapathSimulator }))
);
const AddressingSimulator = lazy(() =>
  import('./components/simulators/addressing/AddressingSimulator.tsx').then((m) => ({ default: m.AddressingSimulator }))
);

// Lazy-Loaded Unit 3 Simulators
const PipelineSimulator = lazy(() =>
  import('./components/simulators/pipeline/PipelineSimulator.tsx').then((m) => ({ default: m.PipelineSimulator }))
);
const ControlUnitSimulator = lazy(() =>
  import('./components/simulators/controlUnit/ControlUnitSimulator.tsx').then((m) => ({ default: m.ControlUnitSimulator }))
);

// Lazy-Loaded Unit 4 Simulators
const CacheMappingSimulator = lazy(() =>
  import('./components/simulators/cacheMapping/CacheMappingSimulator.tsx').then((m) => ({ default: m.CacheMappingSimulator }))
);
const CacheReplacementSimulator = lazy(() =>
  import('./components/simulators/cacheReplacement/CacheReplacementSimulator.tsx').then((m) => ({ default: m.CacheReplacementSimulator }))
);
const VirtualMemorySimulator = lazy(() =>
  import('./components/simulators/virtualMemory/VirtualMemorySimulator.tsx').then((m) => ({ default: m.VirtualMemorySimulator }))
);

// Lazy-Loaded Unit 5 Simulators
const IOTransferSimulator = lazy(() =>
  import('./components/simulators/ioTransfer/IOTransferSimulator.tsx').then((m) => ({ default: m.IOTransferSimulator }))
);
const DMASimulator = lazy(() =>
  import('./components/simulators/dma/DMASimulator.tsx').then((m) => ({ default: m.DMASimulator }))
);

// Lazy-Loaded 60-Session LMS Course Hub
const LMSViewer = lazy(() =>
  import('./components/lms/LMSViewer.tsx').then((m) => ({ default: m.LMSViewer }))
);

// Valid Simulator Tabs
const VALID_TABS: SimulatorTab[] = [
  'lms', 'booth', 'ieee754', 'division', 'numberSystem',
  'vonNeumann', 'datapath', 'addressing',
  'pipeline', 'controlUnit',
  'cacheMapping', 'cacheReplacement', 'virtualMemory',
  'ioTransfer', 'dma',
];

// Helper to map URL hash path to SimulatorTab
function hashToTab(hash: string): SimulatorTab | null {
  const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();
  const map: Record<string, SimulatorTab> = {
    'lms': 'lms',
    'booth': 'booth',
    'ieee754': 'ieee754',
    'ieee-754': 'ieee754',
    'division': 'division',
    'numbersystem': 'numberSystem',
    'number-system': 'numberSystem',
    'vonneumann': 'vonNeumann',
    'von-neumann': 'vonNeumann',
    'datapath': 'datapath',
    'addressing': 'addressing',
    'pipeline': 'pipeline',
    'controlunit': 'controlUnit',
    'control-unit': 'controlUnit',
    'cachemapping': 'cacheMapping',
    'cache-mapping': 'cacheMapping',
    'cachereplacement': 'cacheReplacement',
    'cache-replacement': 'cacheReplacement',
    'virtualmemory': 'virtualMemory',
    'virtual-memory': 'virtualMemory',
    'iotransfer': 'ioTransfer',
    'io-transfer': 'ioTransfer',
    'dma': 'dma',
  };
  return map[clean] || (VALID_TABS.includes(clean as SimulatorTab) ? (clean as SimulatorTab) : null);
}

// Sleek Skeleton Loading Fallback
const SimulatorLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-fadeIn">
    <div className="p-4 rounded-2xl bg-card-surface border border-border-main shadow-xl flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
          <Cpu className="w-6 h-6 animate-pulse" />
        </div>
        <Loader2 className="w-4 h-4 text-accent-primary animate-spin absolute -top-1 -right-1" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-text-heading">Loading Simulation Engine...</h3>
        <p className="text-xs text-text-muted">Initializing hardware registers & cycle logic</p>
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  // Initial tab resolution from URL hash or persistent state
  const initialHashTab = typeof window !== 'undefined' ? hashToTab(window.location.hash) : null;
  const [activeTab, setActiveTabState] = usePersistentState<SimulatorTab>(
    'activeTab',
    initialHashTab || 'vonNeumann'
  );

  const [isDark, setIsDark] = usePersistentState<boolean>('isDark', false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [errorResetKey, setErrorResetKey] = useState<number>(0);

  // Tab switch handler with URL hash sync
  const handleSelectTab = useCallback((tab: SimulatorTab) => {
    setActiveTabState(tab);
    if (window.location.hash !== `#/${tab}`) {
      window.history.pushState(null, '', `#/${tab}`);
    }
  }, [setActiveTabState]);

  // Sync state when URL hash changes (browser back/forward or external deep links)
  useEffect(() => {
    const onHashChange = () => {
      const target = hashToTab(window.location.hash);
      if (target && target !== activeTab) {
        setActiveTabState(target);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activeTab, setActiveTabState]);

  // Initial hash sync on mount
  useEffect(() => {
    if (!window.location.hash && activeTab) {
      window.history.replaceState(null, '', `#/${activeTab}`);
    }
  }, [activeTab]);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDark]);

  // Fullscreen handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Global Keyboard / Remote Shortcuts Hook
  useKeyboardShortcuts({
    onToggleWhiteboard: () => setIsWhiteboardOpen((prev) => !prev),
    onToggleFullscreen: handleToggleFullscreen,
    onToggleTheme: () => setIsDark((prev) => !prev),
    onOpenHelp: () => setIsShortcutsOpen(true),
    onCloseAll: () => {
      setIsWhiteboardOpen(false);
      setIsHelpOpen(false);
      setIsShortcutsOpen(false);
    },
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-accent-primary selection:text-white relative bg-canvas-bg text-text-body transition-colors">
      {/* Background Decorative Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-30 dark:opacity-50 transition-opacity">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Presentation Header Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Simulator & LMS Workspace with Error Isolation and Suspense */}
      <main className="flex-1 p-4 md:p-6 relative z-10 flex flex-col max-w-7xl mx-auto w-full">
        <ErrorBoundary
          key={`${activeTab}_${errorResetKey}`}
          onReset={() => setErrorResetKey((k) => k + 1)}
        >
          <Suspense fallback={<SimulatorLoadingFallback />}>
            {/* LMS Course Hub */}
            {activeTab === 'lms' && <LMSViewer onLaunchSimulator={(tab) => handleSelectTab(tab)} />}

            {/* Unit 1 */}
            {activeTab === 'booth' && <BoothSimulator />}
            {activeTab === 'ieee754' && <IEEE754Simulator />}
            {activeTab === 'division' && <DivisionSimulator />}
            {activeTab === 'numberSystem' && <NumberSystemSandbox />}

            {/* Unit 2 */}
            {activeTab === 'vonNeumann' && <VonNeumannSimulator />}
            {activeTab === 'datapath' && <DatapathSimulator />}
            {activeTab === 'addressing' && <AddressingSimulator />}

            {/* Unit 3 */}
            {activeTab === 'pipeline' && <PipelineSimulator />}
            {activeTab === 'controlUnit' && <ControlUnitSimulator />}

            {/* Unit 4 */}
            {activeTab === 'cacheMapping' && <CacheMappingSimulator />}
            {activeTab === 'cacheReplacement' && <CacheReplacementSimulator />}
            {activeTab === 'virtualMemory' && <VirtualMemorySimulator />}

            {/* Unit 5 */}
            {activeTab === 'ioTransfer' && <IOTransferSimulator />}
            {activeTab === 'dma' && <DMASimulator />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Interactive Smartboard Whiteboard Overlay */}
      <ErrorBoundary onReset={() => setIsWhiteboardOpen(false)}>
        <WhiteboardOverlay
          isOpen={isWhiteboardOpen}
          onClose={() => setIsWhiteboardOpen(false)}
        />
      </ErrorBoundary>

      {/* Help Modal Guide */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Smartboard & Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Desktop Auto-Update Notification Banner */}
      <UpdateBanner />
    </div>
  );
};

export default App;

