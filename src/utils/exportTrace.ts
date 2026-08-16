/**
 * Universal Simulation Trace & Report Exporter
 * Generates CSV, Markdown, formatted plain text, and triggers clean browser printing for lab records.
 */

export interface TraceColumn {
  key: string;
  header: string;
}

export interface TraceExportData {
  title: string;
  subtitle?: string;
  parameters: Record<string, string | number>;
  columns: TraceColumn[];
  rows: Record<string, string | number>[];
  conclusion?: string;
}

/**
 * Generate CSV string from structured trace data
 */
export function generateCSV(data: TraceExportData): string {
  const headers = data.columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const rowLines = data.rows.map((row) =>
    data.columns.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
  );

  return [
    `# ${data.title}`,
    ...(data.subtitle ? [`# ${data.subtitle}`] : []),
    `# Parameters: ${Object.entries(data.parameters).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    '',
    headers,
    ...rowLines,
    ...(data.conclusion ? ['', `# Conclusion: ${data.conclusion}`] : []),
  ].join('\n');
}

/**
 * Generate Markdown Table from structured trace data
 */
export function generateMarkdown(data: TraceExportData): string {
  const headers = `| ${data.columns.map((c) => c.header).join(' | ')} |`;
  const divider = `| ${data.columns.map(() => '---').join(' | ')} |`;
  const rowLines = data.rows.map(
    (row) => `| ${data.columns.map((c) => String(row[c.key] ?? '')).join(' | ')} |`
  );

  return [
    `### ${data.title}`,
    ...(data.subtitle ? [`*${data.subtitle}*`] : []),
    '',
    `**Parameters:** ${Object.entries(data.parameters).map(([k, v]) => `\`${k}: ${v}\``).join(' • ')}`,
    '',
    headers,
    divider,
    ...rowLines,
    ...(data.conclusion ? ['', `**Result:** ${data.conclusion}`] : []),
  ].join('\n');
}

/**
 * Trigger browser file download
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download CSV Trace File
 */
export function exportToCSV(data: TraceExportData, filenamePrefix: string = 'coaviz-trace') {
  const csvContent = generateCSV(data);
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Copy Markdown Table to Clipboard
 */
export async function copyMarkdownToClipboard(data: TraceExportData): Promise<boolean> {
  try {
    const md = generateMarkdown(data);
    await navigator.clipboard.writeText(md);
    return true;
  } catch (e) {
    console.error('Failed to copy markdown to clipboard:', e);
    return false;
  }
}

/**
 * Trigger Formatted Print-to-PDF Window
 */
export function printTraceSheet(data: TraceExportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title} — COAViz Lab Record</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; line-height: 1.4; }
          h1 { margin: 0 0 4px 0; font-size: 20px; color: #0284c7; }
          h2 { margin: 0 0 16px 0; font-size: 13px; color: #64748b; font-weight: 500; }
          .params { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
          .params span { font-weight: 600; margin-right: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
          th { background: #0f172a; color: white; text-align: left; padding: 8px 10px; font-size: 11px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 7px 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .conclusion { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 10px 14px; border-radius: 8px; font-weight: 600; font-size: 12px; }
          .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <h2>COAViz Computer Organization & Architecture Lab Simulation Report</h2>
        <div class="params">
          ${Object.entries(data.parameters)
            .map(([k, v]) => `<span><strong>${k}:</strong> ${v}</span>`)
            .join('')}
        </div>
        <table>
          <thead>
            <tr>${data.columns.map((c) => `<th>${c.header}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.rows
              .map(
                (row) =>
                  `<tr>${data.columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
        ${data.conclusion ? `<div class="conclusion">Result: ${data.conclusion}</div>` : ''}
        <div class="footer">
          <span>Generated by COAViz (SRM Computer Organization & Architecture Platform)</span>
          <span>Date: ${new Date().toLocaleDateString()}</span>
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
