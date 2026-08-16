import React from 'react';
import { X, Keyboard, Touchpad, Sparkles, Cpu, Layers, HardDrive, Database, RefreshCw } from 'lucide-react';
import { useAutoUpdate } from '../../hooks/useAutoUpdate.ts';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { currentVersion, isDesktop, status, checkForUpdates } = useAutoUpdate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="panel-card w-full max-w-3xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                COAViz Smartboard Classroom Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Keyboard shortcuts & simulator units reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl sub-panel border hover:border-cyan-500 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-2 mb-2.5">
              <Keyboard className="w-4 h-4" /> Keyboard & Remote Clicker Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-xs">
                <span className="text-slate-800 dark:text-slate-200 font-sans font-bold">Play / Pause Auto-Step</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 font-black border-2 border-slate-300 dark:border-slate-700 shadow-sm">Space</kbd>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-xs">
                <span className="text-slate-800 dark:text-slate-200 font-sans font-bold">Step Forward</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 font-black border-2 border-slate-300 dark:border-slate-700 shadow-sm">→</kbd>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-xs">
                <span className="text-slate-800 dark:text-slate-200 font-sans font-bold">Step Backward</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 font-black border-2 border-slate-300 dark:border-slate-700 shadow-sm">←</kbd>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-xs">
                <span className="text-slate-800 dark:text-slate-200 font-sans font-bold">Reset Simulator</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 font-black border-2 border-slate-300 dark:border-slate-700 shadow-sm">R</kbd>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-xs">
                <span className="text-slate-800 dark:text-slate-200 font-sans font-bold">Jump to Beginning</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 font-black border-2 border-slate-300 dark:border-slate-700 shadow-sm">Home</kbd>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-xs">
                <span className="text-slate-800 dark:text-slate-200 font-sans font-bold">Jump to Result</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 font-black border-2 border-slate-300 dark:border-slate-700 shadow-sm">End</kbd>
              </div>
            </div>
          </div>

          {/* Units Overview */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2 mb-2.5">
              <Layers className="w-4 h-4" /> Units Overview & Advanced Architecture Simulators
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3.5 rounded-xl sub-panel border space-y-1.5">
                <div className="font-extrabold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Unit 3: 5-Stage CPU Pipeline
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Demonstrates IF, ID, EX, MEM, WB reservation charts, RAW/Load-Use hazard stalls, EX-EX / MEM-EX data forwarding bypasses, and branch flush penalties.
                </p>
              </div>

              <div className="p-3.5 rounded-xl sub-panel border space-y-1.5">
                <div className="font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Unit 3: Control Unit Simulator
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Interactive comparison between Hardwired Control Units (AND/OR Gate Matrix + Timing Counter) and Microprogrammed Control Units (Control Memory ROM + CAR + CDR).
                </p>
              </div>

              <div className="p-3.5 rounded-xl sub-panel border space-y-1.5">
                <div className="font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" /> Unit 4: Cache Mapping & Replacement
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Direct, Associative, and Set-Associative mapping with Tag/Index/Offset bit slicing. Real-time LRU, FIFO, and LFU replacement algorithms with live hit ratio graph.
                </p>
              </div>

              <div className="p-3.5 rounded-xl sub-panel border space-y-1.5">
                <div className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Unit 4: Virtual Memory & TLB
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Virtual Address translation via fast-path TLB Cache, Page Table resident in RAM, and OS Page Fault Trap handler with secondary disk page swap-in.
                </p>
              </div>
            </div>
          </div>

          {/* Smartboard Whiteboard Annotation */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
              <Touchpad className="w-4 h-4" /> Interactive Whiteboard Layer
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed sub-panel p-3.5 border">
              Click the <strong className="text-amber-600 dark:text-amber-300 font-bold">Whiteboard Pen</strong> button in the top bar to open an on-screen transparent annotation canvas. Draw with the <strong>Pen</strong>, highlight with the <strong>Highlighter</strong>, point with the <strong>Laser Pointer</strong>, or erase markings directly during smartboard lectures.
            </p>
          </div>
        </div>

        {/* Footer with App Version & Check for Updates */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {isDesktop ? 'COAViz Desktop' : 'COAViz Web'} <strong className="text-slate-700 dark:text-slate-300">v{currentVersion}</strong>
            </span>

            <button
              onClick={() => checkForUpdates()}
              disabled={status === 'checking'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              {status === 'checking' && <RefreshCw className="w-3 h-3 animate-spin text-cyan-500" />}
              <span>{status === 'checking' ? 'Checking...' : 'Check for Updates'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Got it, Let's Teach!
          </button>
        </div>
      </div>
    </div>
  );
};

