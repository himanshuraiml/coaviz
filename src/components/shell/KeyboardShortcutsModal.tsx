import React from 'react';
import { Keyboard, X, Play, SkipForward, SkipBack, Edit3, Maximize2, Moon, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyLabel: string;
  description: string;
  icon: React.ReactNode;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    {
      keyLabel: 'Space',
      description: 'Toggle Play / Pause animation',
      icon: <Play className="w-4 h-4 text-emerald-500" />,
    },
    {
      keyLabel: '→ or PgDn',
      description: 'Step forward 1 cycle',
      icon: <SkipForward className="w-4 h-4 text-cyan-500" />,
    },
    {
      keyLabel: '← or PgUp',
      description: 'Step backward 1 cycle',
      icon: <SkipBack className="w-4 h-4 text-cyan-500" />,
    },
    {
      keyLabel: 'Home / End',
      description: 'Jump to First / Final cycle',
      icon: <Keyboard className="w-4 h-4 text-indigo-500" />,
    },
    {
      keyLabel: 'W',
      description: 'Toggle Interactive Whiteboard overlay',
      icon: <Edit3 className="w-4 h-4 text-amber-500" />,
    },
    {
      keyLabel: 'F',
      description: 'Toggle Fullscreen Kiosk Mode',
      icon: <Maximize2 className="w-4 h-4 text-blue-500" />,
    },
    {
      keyLabel: 'T',
      description: 'Toggle Dark / High-Contrast Light theme',
      icon: <Moon className="w-4 h-4 text-purple-500" />,
    },
    {
      keyLabel: '? or H',
      description: 'Open Shortcut Guide & Help Modal',
      icon: <HelpCircle className="w-4 h-4 text-rose-500" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden transition-all text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Smartboard & Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Presenter remote & clicker shortcuts for seamless teaching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Shortcuts */}
        <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-accent-primary/50 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                  {item.icon}
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  {item.description}
                </span>
              </div>
              <kbd className="px-2.5 py-1 text-xs font-mono font-black text-accent-primary dark:text-cyan-300 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-sm tracking-wide">
                {item.keyLabel}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span>Works with USB presenter clickers & smartboards</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-black text-xs rounded-xl bg-accent-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
