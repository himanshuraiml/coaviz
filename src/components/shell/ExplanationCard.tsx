import React from 'react';
import { Lightbulb } from 'lucide-react';

interface ExplanationCardProps {
  title: string;
  badge?: string;
  badgeColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
  actionTaken?: string;
  explanation: string;
  formula?: string;
  subNotes?: string[];
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  title,
  badge,
  badgeColor = 'cyan',
  actionTaken,
  explanation,
  formula,
  subNotes,
}) => {
  const borderLeftColors = {
    cyan: 'border-l-cyan-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
    indigo: 'border-l-indigo-500',
  };

  const badgeStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  };

  return (
    <div className={`panel-card p-5 space-y-4 border-l-4 ${borderLeftColors[badgeColor]} shadow-xl relative overflow-hidden transition-all`}>
      {/* Top Title & Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Lightbulb className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Architecture Analysis & Step Rationale
            </span>
          </div>
        </div>

        {badge && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border shrink-0 ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Action / Micro-Op Summary Box */}
      {actionTaken && (
        <div className="sub-panel p-3.5 border font-mono text-sm flex items-center gap-3 bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500/30 text-cyan-950 dark:text-cyan-200">
          <span className="text-cyan-600 dark:text-cyan-400 font-black text-base">▶</span>
          <div className="font-bold text-slate-900 dark:text-cyan-200">
            {actionTaken}
          </div>
        </div>
      )}

      {/* Formula Callout */}
      {formula && (
        <div className="sub-panel p-3 border font-mono text-xs flex items-center gap-2 bg-indigo-500/5 dark:bg-indigo-950/20 border-indigo-500/30 text-indigo-950 dark:text-indigo-200">
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-black text-[10px] uppercase tracking-wider">
            Formula
          </span>
          <span className="font-bold">{formula}</span>
        </div>
      )}

      {/* High Readability Narrative */}
      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
        {explanation}
      </p>

      {/* Exam / Teaching Subnotes */}
      {subNotes && subNotes.length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          {subNotes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">•</span>
              <span className="leading-relaxed">{note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
