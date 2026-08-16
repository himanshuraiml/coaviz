import React, { useState, useEffect, useRef } from 'react';
import { UNITS, SimulatorTab } from './Header.tsx';
import { Search, ArrowRight, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: SimulatorTab) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten all items with unit context and search keywords
  const allItems = React.useMemo(() => {
    return UNITS.flatMap((unit) =>
      unit.simulators.map((sim) => ({
        ...sim,
        unitName: unit.name,
        unitId: unit.id,
        keywords: `${unit.name} ${sim.label} ${sim.badge || ''} ${sim.id}`,
      }))
    );
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.unitName.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          onClose(); // Invert or trigger parent toggle
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelectTab(filteredItems[selectedIndex].id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, onSelectTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-card-bg border border-border-main rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[70vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-main bg-card-surface">
          <Search className="w-5 h-5 text-accent-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search simulators, algorithms, addressing modes, units... (↑↓ to navigate, Enter to select)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-text-heading placeholder:text-text-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-card-bg text-text-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-card-bg text-text-muted px-2 py-1 rounded-lg border border-border-main shrink-0">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-border-main/50">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs">
              No matching simulators found for "<span className="font-bold text-text-heading">{query}</span>"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const ItemIcon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-accent-primary/10 border-l-4 border-accent-primary pl-4 text-text-heading'
                      : 'hover:bg-card-surface text-text-body'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      isSelected
                        ? 'bg-accent-primary text-white border-accent-primary'
                        : 'bg-card-surface border-border-main text-text-muted'
                    }`}>
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-secondary/15 text-accent-secondary">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted block mt-0.5">{item.unitName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-accent-primary font-bold">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-card-surface border-t border-border-main flex items-center justify-between text-[11px] text-text-muted font-mono">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 bg-card-bg border border-border-main rounded text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-card-bg border border-border-main rounded text-[10px]">↓</kbd>
            <span>Confirm:</span>
            <kbd className="px-1.5 py-0.5 bg-card-bg border border-border-main rounded text-[10px]">↵ Enter</kbd>
          </div>
          <span>14 Educational Simulators</span>
        </div>
      </div>
    </div>
  );
};
