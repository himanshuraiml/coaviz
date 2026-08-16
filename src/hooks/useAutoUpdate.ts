import { useState, useEffect, useCallback, useRef } from 'react';
import type { UpdateProgress, UpdateInfo, AutoUpdateStatus } from '../types/desktop.d.ts';

export interface UseAutoUpdateResult {
  isDesktop: boolean;
  currentVersion: string;
  targetVersion: string | null;
  status: AutoUpdateStatus;
  progress: UpdateProgress | null;
  updateInfo: UpdateInfo | null;
  errorMessage: string | null;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

// Check if running inside Tauri runtime
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

export function useAutoUpdate(): UseAutoUpdateResult {
  const isDesktop = isTauriEnvironment();
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [targetVersion, setTargetVersion] = useState<string | null>(null);
  const [status, setStatus] = useState<AutoUpdateStatus>('idle');
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  
  // Keep active update handle in ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeUpdateRef = useRef<any>(null);

  // Fetch current version on mount
  useEffect(() => {
    if (!isDesktop) return;

    import('@tauri-apps/api/app')
      .then(({ getVersion }) => getVersion())
      .then((v) => {
        if (v) setCurrentVersion(v);
      })
      .catch(() => {});
  }, [isDesktop]);

  // Check for updates implementation
  const checkForUpdates = useCallback(async () => {
    if (!isDesktop) {
      if (typeof window !== 'undefined') {
        window.open('https://github.com/himanshuraiml/coaviz/releases', '_blank');
      }
      return;
    }

    setStatus('checking');
    setErrorMessage(null);

    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update) {
        activeUpdateRef.current = update;
        setTargetVersion(update.version);
        setUpdateInfo({
          version: update.version,
          releaseDate: update.date,
          releaseNotes: update.body,
        });
        setStatus('available');
        setIsBannerDismissed(false);

        // Auto-download update in background
        setStatus('downloading');
        let downloaded = 0;
        let totalLength = 0;
        let lastTime = Date.now();
        let lastDownloaded = 0;

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              totalLength = event.data.contentLength || 0;
              break;

            case 'Progress': {
              downloaded += event.data.chunkLength;
              const now = Date.now();
              const elapsedSec = (now - lastTime) / 1000;
              let speed = 0;
              if (elapsedSec > 0.5) {
                speed = (downloaded - lastDownloaded) / elapsedSec;
                lastTime = now;
                lastDownloaded = downloaded;
              }
              const percent = totalLength > 0 ? (downloaded / totalLength) * 100 : 0;
              setProgress({
                percent,
                bytesPerSecond: speed,
                transferred: downloaded,
                total: totalLength,
              });
              break;
            }

            case 'Finished':
              setStatus('downloaded');
              setProgress({
                percent: 100,
                bytesPerSecond: 0,
                transferred: totalLength,
                total: totalLength,
              });
              break;
          }
        });

        setStatus('downloaded');
      } else {
        setStatus('not-available');
      }
    } catch (err: unknown) {
      console.warn('[Tauri Updater]', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unable to check for updates');
    }
  }, [isDesktop]);

  // Initial automatic background check after startup
  useEffect(() => {
    if (!isDesktop) return;

    const timer = setTimeout(() => {
      checkForUpdates().catch(() => {});
    }, 4000);

    return () => clearTimeout(timer);
  }, [isDesktop, checkForUpdates]);

  // Restart & Install application
  const installUpdate = useCallback(async () => {
    if (!isDesktop) return;

    try {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err: unknown) {
      console.error('Failed to restart application:', err);
    }
  }, [isDesktop]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
  }, []);

  return {
    isDesktop,
    currentVersion,
    targetVersion,
    status,
    progress,
    updateInfo,
    errorMessage,
    isBannerDismissed,
    dismissBanner,
    checkForUpdates,
    installUpdate,
  };
}
