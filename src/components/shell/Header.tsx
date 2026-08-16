import React, { useState } from 'react';
import { 
  Cpu, 
  Binary, 
  Maximize2, 
  Minimize2, 
  PenTool, 
  Sun, 
  Moon, 
  Sparkles, 
  HelpCircle,
  Calculator,
  Network,
  Layers,
  HardDrive,
  Activity,
  Database,
  Sliders,
  Radio,
  Share2,
  GraduationCap,
  ChevronDown,
  Keyboard
} from 'lucide-react';

export type SimulatorTab = 
  | 'booth'
  | 'ieee754'
  | 'division'
  | 'numberSystem'
  | 'vonNeumann'
  | 'datapath'
  | 'addressing'
  | 'pipeline'
  | 'controlUnit'
  | 'cacheMapping'
  | 'cacheReplacement'
  | 'virtualMemory'
  | 'ioTransfer'
  | 'dma'
  | 'lms';

interface HeaderProps {
  activeTab: SimulatorTab;
  onSelectTab: (tab: SimulatorTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isWhiteboardOpen: boolean;
  onToggleWhiteboard: () => void;
  onOpenHelp: () => void;
  onOpenShortcuts: () => void;
}

export const UNITS = [
  {
    id: 'unit1',
    name: 'Unit 1: Computer Arithmetic',
    shortName: 'Unit 1: Arithmetic',
    icon: Binary,
    simulators: [
      { id: 'booth' as SimulatorTab, label: "Booth's Multiplier", icon: Binary },
      { id: 'ieee754' as SimulatorTab, label: 'IEEE-754 Floating Point', icon: Calculator },
      { id: 'division' as SimulatorTab, label: 'Binary Restoring Division', icon: Binary },
      { id: 'numberSystem' as SimulatorTab, label: 'Number System Sandbox', icon: Sparkles },
    ],
  },
  {
    id: 'unit2',
    name: 'Unit 2: CPU & Datapath',
    shortName: 'Unit 2: CPU & Datapath',
    icon: Cpu,
    simulators: [
      { id: 'vonNeumann' as SimulatorTab, label: 'Von Neumann Architecture', icon: Cpu, badge: 'Cross-Section' },
      { id: 'datapath' as SimulatorTab, label: 'CPU Bus & Datapath', icon: Activity, badge: 'X-Ray ALU' },
      { id: 'addressing' as SimulatorTab, label: 'Addressing Modes', icon: Network },
    ],
  },
  {
    id: 'unit3',
    name: 'Unit 3: Pipeline & Control',
    shortName: 'Unit 3: Pipeline',
    icon: Layers,
    simulators: [
      { id: 'pipeline' as SimulatorTab, label: '5-Stage Pipeline', icon: Layers, badge: 'Hazard & Forwarding' },
      { id: 'controlUnit' as SimulatorTab, label: 'Hardwired Control Unit', icon: Sliders },
    ],
  },
  {
    id: 'unit4',
    name: 'Unit 4: Memory & Cache',
    shortName: 'Unit 4: Memory & Cache',
    icon: HardDrive,
    simulators: [
      { id: 'cacheMapping' as SimulatorTab, label: 'Cache Mapping & Comparator', icon: HardDrive, badge: 'SRAM & Tag' },
      { id: 'cacheReplacement' as SimulatorTab, label: 'Cache Replacement (LRU/FIFO)', icon: Activity },
      { id: 'virtualMemory' as SimulatorTab, label: 'Virtual Memory & TLB', icon: Database },
    ],
  },
  {
    id: 'unit5',
    name: 'Unit 5: I/O & DMA',
    shortName: 'Unit 5: I/O & DMA',
    icon: Radio,
    simulators: [
      { id: 'ioTransfer' as SimulatorTab, label: 'I/O Transfer Modes', icon: Radio },
      { id: 'dma' as SimulatorTab, label: 'DMA Controller Bus Steal', icon: Share2 },
    ],
  },
  {
    id: 'lms',
    name: '60-Session Course LMS Hub',
    shortName: '60-Session LMS',
    icon: GraduationCap,
    simulators: [
      { id: 'lms' as SimulatorTab, label: '60-Session Syllabus & Lab Plan', icon: GraduationCap },
    ],
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  isWhiteboardOpen,
  onToggleWhiteboard,
  onOpenHelp,
  onOpenShortcuts,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Find active simulator item
  const activeSim = UNITS.flatMap((u) => u.simulators).find((s) => s.id === activeTab);
  const activeUnit = UNITS.find((u) => u.simulators.some((s) => s.id === activeTab)) || UNITS[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-card-bg/95 border-b border-border-main backdrop-blur-xl shadow-sm transition-colors">
      {/* Main Top Header Row */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div 
          onClick={() => onSelectTab('lms')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary via-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-accent-primary/20 flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/>
                <rect x="9" y="9" width="6" height="6" strokeWidth="2"/>
                <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-text-heading">
                COA<span className="text-accent-primary">Viz</span>
              </h1>
            </div>
            <p className="text-[11px] text-text-muted font-medium hidden md:block">
              Interactive Computer Organization & Architecture Visualizer
            </p>
          </div>
        </div>

        {/* Center: Active Subsystem Dropdown Navigator with Solid Opaque Background */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-card-surface border border-border-main hover:border-accent-primary transition-all text-xs font-bold shadow-sm cursor-pointer"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-accent-primary animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-wider text-text-faint font-bold">
                {activeUnit.shortName}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-text-heading">
                {activeSim?.label || 'Select Architecture Module'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded Dropdown Menu with solid opaque background & click-outside backdrop */}
          {isDropdownOpen && (
            <>
              {/* Click-away backdrop overlay */}
              <div 
                className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px]" 
                onClick={() => setIsDropdownOpen(false)} 
              />

              {/* Dropdown Container */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] sm:w-[500px] p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-2xl z-50 max-h-[80vh] overflow-y-auto space-y-3.5">
                {UNITS.map((unit) => {
                  const UnitIcon = unit.icon;
                  return (
                    <div key={unit.id} className="space-y-1.5">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-text-heading border-b border-border-main bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <UnitIcon className="w-3.5 h-3.5 text-accent-primary" />
                        <span>{unit.name}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {unit.simulators.map((sim) => {
                          const SimIcon = sim.icon;
                          const isCurrent = activeTab === sim.id;
                          return (
                            <button
                              key={sim.id}
                              onClick={() => {
                                onSelectTab(sim.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-accent-primary text-white shadow-md'
                                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-accent-primary/15 hover:text-accent-primary text-text-body border border-border-main'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <SimIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-text-muted'}`} />
                                <span className="truncate">{sim.label}</span>
                              </div>
                              {sim.badge && (
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ml-1 ${
                                  isCurrent ? 'bg-white/20 text-white' : 'bg-accent-primary/10 text-accent-primary'
                                }`}>
                                  {sim.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Classroom Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Whiteboard Pen */}
          <button
            onClick={onToggleWhiteboard}
            title="Toggle Smartboard Whiteboard Annotation Layer (Key: W)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 ${
              isWhiteboardOpen
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden lg:inline">Whiteboard (W)</span>
          </button>

          {/* Keyboard Shortcuts Cheatsheet */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard & Remote Clicker Shortcuts (Key: ? or H)"
            className="p-2 rounded-xl bg-card-surface border border-border-main hover:border-accent-primary text-text-body transition-all shadow-sm active:scale-95"
          >
            <Keyboard className="w-4 h-4 text-accent-primary" />
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            title="Toggle High-Contrast Dual Theme (Key: T)"
            className="p-2 rounded-xl bg-card-surface border border-border-main hover:border-accent-primary text-text-body transition-all shadow-sm active:scale-95"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Fullscreen Mode */}
          <button
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen Mode (Key: F)"
            className="p-2 rounded-xl bg-card-surface border border-border-main hover:border-accent-primary text-text-body transition-all shadow-sm active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-accent-primary" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Help Guide */}
          <button
            onClick={onOpenHelp}
            title="Syllabus & Lab User Guide"
            className="p-2 rounded-xl bg-card-surface border border-border-main hover:border-accent-primary text-text-body transition-all shadow-sm active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Header Horizontal Unit Bar */}
      <div className="px-4 sm:px-6 py-2 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-2">
          {UNITS.map((unit) => {
            const isUnitActive = unit.simulators.some((s) => s.id === activeTab);
            return (
              <button
                key={unit.id}
                onClick={() => onSelectTab(unit.simulators[0].id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer ${
                  isUnitActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50 scale-[1.02]'
                    : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-xs'
                }`}
              >
                {unit.shortName}
              </button>
            );
          })}
        </div>

        {/* Active Unit's Sibling Simulators */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-300 dark:border-slate-700 text-xs shrink-0">
          {activeUnit.simulators.map((sim) => {
            const isActive = activeTab === sim.id;
            return (
              <button
                key={sim.id}
                onClick={() => onSelectTab(sim.id)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 dark:bg-blue-500 text-white font-black shadow-sm ring-1 ring-blue-400'
                    : 'bg-white/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs'
                }`}
              >
                {sim.label.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
