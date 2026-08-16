import React, { useState } from 'react';
import { Download, FileSpreadsheet, Copy, Printer, Check } from 'lucide-react';
import { TraceExportData, exportToCSV, copyMarkdownToClipboard, printTraceSheet } from '../../utils/exportTrace.ts';

interface ExportMenuProps {
  data: TraceExportData;
  filenamePrefix?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ data, filenamePrefix }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    const success = await copyMarkdownToClipboard(data);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card-surface border border-border-main hover:border-accent-primary text-text-body text-xs font-bold transition-all shadow-sm active:scale-95"
        title="Export simulation trace report"
      >
        <Download className="w-3.5 h-3.5 text-accent-primary" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl bg-card-bg border border-border-main shadow-xl z-40 p-1.5 space-y-1 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => exportToCSV(data, filenamePrefix)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-body hover:bg-card-surface hover:text-text-heading transition-colors text-left"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-body hover:bg-card-surface hover:text-text-heading transition-colors text-left"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Copied Markdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-accent-primary" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={() => printTraceSheet(data)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-body hover:bg-card-surface hover:text-text-heading transition-colors text-left"
          >
            <Printer className="w-4 h-4 text-indigo-500" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
