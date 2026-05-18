"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ResultTabs from "@/components/ResultTabs";
import type { AnalysisReport } from "@/types/analysis";
import { fileRowsFromFunctions } from "@/lib/analysis/derive";

type HistoryItem = {
  id: string;
  timestamp: number;
  fileNameSummary: string;
  language: string;
  fileCount: number;
  averageComplexity: number;
  report: AnalysisReport;
};

function formatDateTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function PrintTables({ report, title }: { report: AnalysisReport; title: string }) {
  const fileRows = useMemo(() => fileRowsFromFunctions(report.functions), [report.functions]);

  return (
    <section className="print-only space-y-6">
      <div className="space-y-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-slate-600">
          Total files: {report.summary.totalFiles} · Total functions: {report.summary.totalFunctions} · Avg CC:{" "}
          {report.summary.averageComplexity.toFixed(1)} · Avg MI: {report.summary.averageMaintainability.toFixed(0)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">Functions</div>
        <table className="text-[11px]">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">File</th>
              <th className="px-2 py-1 text-left">Function</th>
              <th className="px-2 py-1 text-right">CC</th>
              <th className="px-2 py-1 text-right">HV</th>
              <th className="px-2 py-1 text-right">MI</th>
              <th className="px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.functions.map((f) => (
              <tr key={`${f.filePath}:${f.functionName}:${f.startLine ?? 0}`}>
                <td className="px-2 py-1">{f.filePath}</td>
                <td className="px-2 py-1">{f.functionName}</td>
                <td className="px-2 py-1 text-right">{f.cyclomatic}</td>
                <td className="px-2 py-1 text-right">{Math.round(f.halstead.volume)}</td>
                <td className="px-2 py-1 text-right">{Math.round(f.maintainabilityScore)}</td>
                <td className="px-2 py-1">{f.complexityStatus.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 print-page-break">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">Files</div>
        <table className="text-[11px]">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">File</th>
              <th className="px-2 py-1 text-right">Functions</th>
              <th className="px-2 py-1 text-right">Avg CC</th>
              <th className="px-2 py-1 text-right">Max CC</th>
              <th className="px-2 py-1 text-right">Avg MI</th>
              <th className="px-2 py-1 text-right">Est. Bugs</th>
              <th className="px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {fileRows.map((r) => (
              <tr key={r.filePath}>
                <td className="px-2 py-1">{r.filePath}</td>
                <td className="px-2 py-1 text-right">{r.totalFunctions}</td>
                <td className="px-2 py-1 text-right">{r.averageComplexity.toFixed(1)}</td>
                <td className="px-2 py-1 text-right">{r.maxComplexity}</td>
                <td className="px-2 py-1 text-right">{r.averageMaintainability.toFixed(0)}</td>
                <td className="px-2 py-1 text-right">{r.estimatedBugs.toFixed(3)}</td>
                <td className="px-2 py-1">{r.status.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ResultsClient({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [title, setTitle] = useState("Analysis Results");
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    try {
      const id = initialId || localStorage.getItem("codemetrik_latest_result_id") || "";

      if (id) {
        const raw = localStorage.getItem("codemetrik_history");
        const list: HistoryItem[] = raw ? JSON.parse(raw) : [];
        const item = list.find((h) => h.id === id) ?? list[0];
        if (item?.report) {
          setReport(item.report);
          setTitle(`${item.fileNameSummary} · ${formatDateTime(item.timestamp)}`);
          return;
        }
      }

      const fallback = localStorage.getItem("codemetrik_latest_report");
      if (fallback) {
        setReport(JSON.parse(fallback));
        setTitle("Latest Analysis");
        return;
      }

      setError("No analysis result found. Run an analysis first.");
    } catch (e) {
      console.error("Failed to load results:", e);
      setError("Failed to load analysis results.");
    }
  }, [initialId]);

  async function exportExcel() {
    if (!report) return;
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const fileRows = fileRowsFromFunctions(report.functions);

      const functionsSheetRows = report.functions.map((f) => ({
        File: f.filePath,
        Function: f.functionName,
        StartLine: f.startLine ?? "",
        EndLine: f.endLine ?? "",
        CC: f.cyclomatic,
        HV: Math.round(f.halstead.volume),
        MI: Math.round(f.maintainabilityScore),
        EstimatedBugs: Number((f.halstead.estimatedBugs || 0).toFixed(6)),
        Status: f.complexityStatus,
      }));

      const filesSheetRows = fileRows.map((r) => ({
        File: r.filePath,
        Functions: r.totalFunctions,
        AvgCC: Number(r.averageComplexity.toFixed(2)),
        MaxCC: r.maxComplexity,
        AvgMI: Number(r.averageMaintainability.toFixed(0)),
        EstimatedBugs: Number(r.estimatedBugs.toFixed(6)),
        Status: r.status,
      }));

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(functionsSheetRows);
      const ws2 = XLSX.utils.json_to_sheet(filesSheetRows);
      XLSX.utils.book_append_sheet(wb, ws1, "Functions");
      XLSX.utils.book_append_sheet(wb, ws2, "Files");

      const name = `codemetrik-results-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, name, { compression: true });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="space-y-6 animate-fade-in">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/analyzer"
              className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            >
              ← Back to Analyzer
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
              title="Reload results"
            >
              Refresh
            </button>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100">{title}</h1>
          <p className="text-xs text-slate-500">
            Print PDF exports only the data tables (Functions & Files) in a clean minimalist format.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!report}
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none"
            title="Print as PDF"
          >
            Print PDF
          </button>
          <button
            type="button"
            onClick={exportExcel}
            disabled={!report || isExporting}
            className="rounded-lg border border-slate-800 bg-slate-900/30 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            title="Export Excel"
          >
            {isExporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="no-print rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
          <div className="font-semibold text-slate-100">No Results</div>
          <div className="mt-1 text-xs text-slate-400">{error}</div>
          <div className="mt-4">
            <Link
              href="/analyzer"
              className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Go to Analyzer
            </Link>
          </div>
        </div>
      ) : null}

      {report ? (
        <>
          <div className="no-print">
            <ResultTabs report={report} />
          </div>
          <PrintTables report={report} title={title} />
        </>
      ) : null}
    </main>
  );
}

