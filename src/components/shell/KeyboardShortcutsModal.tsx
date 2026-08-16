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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card-bg border border-border-main rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden transition-all text-text-body">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-main pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-heading">
                Smartboard & Keyboard Shortcuts
              </h2>
              <p className="text-xs text-text-muted">
                Presenter remote & clicker shortcuts for seamless teaching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-card-surface border border-transparent hover:border-border-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Shortcuts */}
        <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-card-surface border border-border-main/60 hover:border-border-main transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-card-bg border border-border-main">
                  {item.icon}
                </div>
                <span className="text-xs sm:text-sm font-medium text-text-body">
                  {item.description}
                </span>
              </div>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-text-heading bg-card-subtle border border-border-main rounded-lg shadow-sm">
                {item.keyLabel}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-border-main flex items-center justify-between text-xs text-text-muted">
          <span>Works with USB presenter clickers & smartboards</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-xs rounded-lg bg-accent-primary text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
