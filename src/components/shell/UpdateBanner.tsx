import React from 'react';
import { ArrowUpCircle, RefreshCw, Download, X, Sparkles } from 'lucide-react';
import { useAutoUpdate } from '../../hooks/useAutoUpdate.ts';

export const UpdateBanner: React.FC = () => {
  const {
    isDesktop,
    targetVersion,
    status,
    progress,
    isBannerDismissed,
    dismissBanner,
    installUpdate,
  } = useAutoUpdate();

  if (!isDesktop || isBannerDismissed) return null;
  if (status !== 'downloading' && status !== 'downloaded' && status !== 'available') return null;

  const percent = progress ? Math.round(progress.percent) : 0;
  const speedMB = progress && progress.bytesPerSecond > 0 
    ? (progress.bytesPerSecond / (1024 * 1024)).toFixed(1) 
    : null;

  return (
    <aside aria-label="Application update notification" className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-slideInUp">
      <div className="panel-card rounded-2xl p-4 sm:p-5 border-2 border-cyan-500/40 shadow-2xl backdrop-blur-2xl bg-slate-900/95 text-slate-100 dark:bg-slate-950/95 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              status === 'downloaded' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' 
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
            }`}>
              {status === 'downloaded' ? (
                <Sparkles className="w-5 h-5" />
              ) : status === 'downloading' ? (
                <Download className="w-5 h-5 animate-bounce" />
              ) : (
                <ArrowUpCircle className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {status === 'downloaded' ? 'Ready to Install' : 'Auto-Update'}
                </span>
                {targetVersion && (
                  <span className="text-xs font-mono font-bold text-slate-400">
                    v{targetVersion}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black text-white mt-0.5">
                {status === 'downloaded'
                  ? 'Update Downloaded!'
                  : status === 'downloading'
                  ? 'Downloading Update...'
                  : 'New Version Available'}
              </h4>
            </div>
          </div>

          <button
            onClick={dismissBanner}
            title="Dismiss notification (Update will install on next quit)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status description & Progress Bar */}
        {status === 'downloading' && (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs text-slate-300 font-mono">
              <span>{percent}% completed</span>
              {speedMB && <span>{speedMB} MB/s</span>}
            </div>
            {/* Progress track */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/50"
                style={{ width: `${Math.max(4, percent)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Downloading in background. You can continue studying without interruption.
            </p>
          </div>
        )}

        {status === 'available' && (
          <p className="text-xs text-slate-300 leading-relaxed">
            A new version of COAViz is available and will automatically download in the background.
          </p>
        )}

        {status === 'downloaded' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-300 leading-relaxed">
              COAViz has downloaded the latest update. Restart now to apply new features and optimizations, or it will apply automatically next time you close the app.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={installUpdate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer font-sans"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Restart & Install Now</span>
              </button>

              <button
                onClick={dismissBanner}
                className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              >
                Later
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
