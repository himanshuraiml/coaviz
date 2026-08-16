import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Copy, Check, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTab?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('COAViz Uncaught Simulator Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleCopyDetails = () => {
    const errorDetails = `COAViz Error Report
Timestamp: ${new Date().toISOString()}
Error: ${this.state.error?.message || 'Unknown Error'}
Stack Trace:
${this.state.error?.stack || 'No stack trace available'}
Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack available'}`;

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[450px]">
          <div className="max-w-2xl w-full panel-card p-6 sm:p-8 border-2 border-rose-500/40 rounded-3xl shadow-2xl space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <AlertOctagon className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  Simulation Recovery
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Simulation Engine Error
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              An unexpected calculation or render state occurred within this module. The rest of the application remains functional. You can reset the simulation or return to the course hub.
            </p>

            {/* Error Message Box */}
            <div className="sub-panel p-4 border border-rose-500/30 rounded-2xl font-mono text-xs text-rose-800 dark:text-rose-300 bg-rose-500/5 space-y-1.5 overflow-x-auto">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown runtime error'}
              </div>
              {this.state.error?.stack && (
                <pre className="text-[11px] text-slate-500 dark:text-slate-400 max-h-36 overflow-y-auto whitespace-pre-wrap mt-2">
                  {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Simulation</span>
                </button>

                <a
                  href="#/lms"
                  onClick={this.handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Course LMS Hub</span>
                </a>
              </div>

              <button
                onClick={this.handleCopyDetails}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Diagnostics Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Error Log</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
