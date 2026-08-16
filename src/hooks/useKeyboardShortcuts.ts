import { useEffect } from 'react';

export interface ShortcutHandlers {
  onTogglePlay?: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onStepFirst?: () => void;
  onStepLast?: () => void;
  onToggleWhiteboard?: () => void;
  onToggleFullscreen?: () => void;
  onToggleTheme?: () => void;
  onOpenHelp?: () => void;
  onOpenSearch?: () => void;
  onCloseAll?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, isEnabled: boolean = true) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Search Command Palette (Cmd+K / Ctrl+K) works even inside or outside inputs
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onOpenSearch?.();
        return;
      }

      // Don't trigger simulator shortcuts if user is typing inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        if (e.key === 'Escape' && handlers.onCloseAll) {
          handlers.onCloseAll();
        }
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlers.onTogglePlay?.();
          break;

        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          handlers.onStepForward?.();
          break;

        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          handlers.onStepBackward?.();
          break;

        case 'Home':
          e.preventDefault();
          handlers.onStepFirst?.();
          break;

        case 'End':
          e.preventDefault();
          handlers.onStepLast?.();
          break;

        case 'k':
        case 'K':
        case '/':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onOpenSearch?.();
          }
          break;

        case 'w':
        case 'W':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onToggleWhiteboard?.();
          }
          break;

        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onToggleFullscreen?.();
          }
          break;

        case 't':
        case 'T':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onToggleTheme?.();
          }
          break;

        case '?':
        case 'h':
        case 'H':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onOpenHelp?.();
          }
          break;

        case 'Escape':
          handlers.onCloseAll?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, isEnabled]);
}
