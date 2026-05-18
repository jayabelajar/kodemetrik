"use client";

import { useMemo, useState } from "react";
import type { AnalysisReport, ComplexityStatus, FunctionReport } from "@/types/analysis";
import MetricTable from "@/components/MetricTable";
import ResultCard from "@/components/ResultCard";

type FileRow = {
  filePath: string;
  totalFunctions: number;
  averageComplexity: number;
  maxComplexity: number;
  averageMaintainability: number;
  estimatedBugs: number;
  status: ComplexityStatus;
};

function overallStatus(avgComplexity: number): "Good" | "Moderate" | "High" {
  if (avgComplexity <= 10) return "Good";
  if (avgComplexity <= 20) return "Moderate";
  return "High";
}

function statusForFile(functions: FunctionReport[]): ComplexityStatus {
  const hasHigh = functions.some((f) => f.complexityStatus === "high");
  if (hasHigh) return "high";
  const hasMedium = functions.some((f) => f.complexityStatus === "medium");
  if (hasMedium) return "medium";
  return "good";
}

function SimpleBarChart({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
      <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</span>
      </div>
      <div className="mt-4 space-y-3.5">
        {items.length > 0 ? (
          items.map((i) => (
            <div key={i.label} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="truncate text-slate-400 max-w-[280px]" title={i.label}>{i.label}</span>
                <span className="font-semibold text-slate-200">{i.value.toFixed(1)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-900 border border-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500"
                  style={{ width: `${Math.max(2, Math.round((i.value / max) * 100))}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">No chart data available.</div>
        )}
      </div>
    </div>
  );
}

function fileRowsFromFunctions(functions: FunctionReport[]): FileRow[] {
  const map = new Map<string, FunctionReport[]>();
  for (const f of functions) {
    const arr = map.get(f.filePath) ?? [];
    arr.push(f);
    map.set(f.filePath, arr);
  }

  const rows: FileRow[] = [];
  for (const [filePath, list] of map.entries()) {
    const totalFunctions = list.length;
    const averageComplexity = list.reduce((s, f) => s + f.cyclomatic, 0) / Math.max(1, totalFunctions);
    const maxComplexity = list.reduce((m, f) => Math.max(m, f.cyclomatic), 0);
    const averageMaintainability =
      list.reduce((s, f) => s + f.maintainabilityScore, 0) / Math.max(1, totalFunctions);
    const estimatedBugs = list.reduce((s, f) => s + (f.halstead.estimatedBugs || 0), 0);
    rows.push({
      filePath,
      totalFunctions,
      averageComplexity,
      maxComplexity,
      averageMaintainability,
      estimatedBugs,
      status: statusForFile(list),
    });
  }

  rows.sort((a, b) => b.maxComplexity - a.maxComplexity);
  return rows;
}

function StatusPill({ status }: { status: ComplexityStatus }) {
  const styles = {
    good: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider",
        styles[status],
      ].join(" ")}
    >
      {status === "good" ? "SAFE" : status === "medium" ? "WARNING" : "CRITICAL"}
    </span>
  );
}

export default function ResultTabs({ report }: { report: AnalysisReport }) {
  const [tab, setTab] = useState<"overview" | "functions" | "files" | "charts">("overview");
  const [filePage, setFilePage] = useState(1);
  const filesPerPage = 20;

  const statusCounts = useMemo(() => {
    const good = report.functions.filter((f) => f.complexityStatus === "good").length;
    const medium = report.functions.filter((f) => f.complexityStatus === "medium").length;
    const high = report.functions.filter((f) => f.complexityStatus === "high").length;
    return { good, medium, high };
  }, [report.functions]);

  const estimatedBugs = useMemo(
    () => report.functions.reduce((s, f) => s + (f.halstead.estimatedBugs || 0), 0),
    [report.functions],
  );

  const highRiskFunctions = useMemo(
    () =>
      report.functions.filter(
        (f) => f.complexityStatus === "high" || (typeof f.riskScore === "number" && f.riskScore >= 75),
      ).length,
    [report.functions],
  );

  const fileRows = useMemo(() => fileRowsFromFunctions(report.functions), [report.functions]);

  const totalFilePages = Math.ceil(fileRows.length / filesPerPage) || 1;
  const paginatedFileRows = useMemo(() => {
    const start = (filePage - 1) * filesPerPage;
    return fileRows.slice(start, start + filesPerPage);
  }, [fileRows, filePage]);

  const topComplexity = useMemo(
    () =>
      [...report.functions]
        .sort((a, b) => b.cyclomatic - a.cyclomatic)
        .slice(0, 8)
        .map((f) => ({ label: `${f.filePath.split("/").pop()}:${f.functionName}`, value: f.cyclomatic })),
    [report.functions],
  );

  const topEffort = useMemo(
    () =>
      [...report.functions]
        .sort((a, b) => b.halstead.effort - a.halstead.effort)
        .slice(0, 8)
        .map((f) => ({ label: `${f.filePath.split("/").pop()}:${f.functionName}`, value: f.halstead.effort })),
    [report.functions],
  );

  const overall = overallStatus(report.summary.averageComplexity);

  return (
    <section className="space-y-6">
      {/* Dashboard Subheader Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-3 no-print">
        <div className="flex flex-wrap rounded-lg bg-slate-900/60 p-1 border border-slate-800/80">
          {(
            [
              ["overview", "Overview", <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>],
              ["functions", "Functions & Metrics", <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>],
              ["files", "Files Report", <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>],
              ["charts", "Charts & Insights", <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                tab === id
                  ? "bg-slate-950 text-slate-50 border border-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              ].join(" ")}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-slate-500 uppercase hidden sm:inline-block">
            Client Static AST Pipeline Done
          </span>
        </div>
      </div>

      {/* Overview Dashboard Tab */}
      {tab === "overview" ? (
        <div className="space-y-6">
          {/* Diagnostic Metrics Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-6">
            <ResultCard label="Total Files" value={String(report.summary.totalFiles)} />
            <ResultCard label="Total Functions" value={String(report.summary.totalFunctions)} />
            <ResultCard
              label="Average Complexity"
              value={report.summary.averageComplexity.toFixed(1)}
              hint="Average linear cyclomatic paths"
            />
            <ResultCard
              label="High Risk Functions"
              value={String(highRiskFunctions)}
              hint="Complexity status = high"
            />
            <ResultCard
              label="Estimated Bugs"
              value={estimatedBugs.toFixed(3)}
              hint="Mathematical Halstead bug density"
            />
            <div className="group relative rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-all hover:border-slate-700 shadow-md">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Global Rating
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    overall === "Good"
                      ? "bg-sky-400"
                      : overall === "Moderate"
                        ? "bg-amber-400"
                        : "bg-red-400",
                  ].join(" ")}
                />
                <span className="text-xl font-bold tracking-tight text-slate-100">{overall}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500 font-mono">Based on average linear branch counts</div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Status counts card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Complexity Breakdown
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Function distribution based on safety levels.
                </p>
                <div className="mt-5 space-y-3">
                  {/* Good progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-sky-400">Simple &amp; Safe (CC &le; 10)</span>
                      <span className="font-mono text-slate-300">{statusCounts.good}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-900">
                      <div
                        className="h-1.5 rounded-full bg-sky-400"
                        style={{
                          width: `${(statusCounts.good / Math.max(1, report.summary.totalFunctions)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-amber-400">Moderate Risk (CC 11-20)</span>
                      <span className="font-mono text-slate-300">{statusCounts.medium}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-900">
                      <div
                        className="h-1.5 rounded-full bg-amber-400"
                        style={{
                          width: `${(statusCounts.medium / Math.max(1, report.summary.totalFunctions)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* High progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-red-400">High Risk / Critical (CC &gt; 20)</span>
                      <span className="font-mono text-slate-300">{statusCounts.high}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-900">
                      <div
                        className="h-1.5 rounded-full bg-red-400"
                        style={{
                          width: `${(statusCounts.high / Math.max(1, report.summary.totalFunctions)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 border-t border-slate-900 pt-3 text-[10px] text-slate-500">
                💡 Target CC &le; 10 to make unit testing and maintenance easier.
              </div>
            </div>

            {/* Recommendations card */}
            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Refactoring Recommendations
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Actionable steps to optimize static code structures.
              </p>

              <div className="mt-4 max-h-[220px] overflow-y-auto space-y-2.5 pr-1">
                {report.recommendations.length > 0 ? (
                  report.recommendations.map((r, index) => {
                    const isHigh =
                      r.includes("very high") ||
                      r.includes("High") ||
                      r.includes("too complex") ||
                      r.includes("sangat tinggi") ||
                      r.includes("terlalu kompleks");
                    return (
                      <div
                        key={index}
                        className={[
                          "rounded-lg border p-3 text-xs leading-relaxed flex items-start gap-2.5",
                          isHigh
                            ? "border-red-500/20 bg-red-500/5 text-red-200"
                            : "border-slate-800 bg-slate-900/35 text-slate-300",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "mt-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold",
                            isHigh ? "bg-red-400/20 text-red-400" : "bg-slate-800 text-slate-400",
                          ].join(" ")}
                        >
                          !
                        </div>
                        <div>{r}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 mb-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    <p className="text-xs font-semibold text-slate-400">Excellent Code Quality</p>
                    <p className="text-[10px] text-slate-505">No major structural issues detected in the code.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Functions Tab (Renders MetricTable) */}
      {tab === "functions" ? (
        <div className="space-y-4">
          <MetricTable rows={report.functions} />
        </div>
      ) : null}

      {/* Files Tab (Renders detailed file statistics) */}
      {tab === "files" ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-900 bg-slate-900/40">
                <tr className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  <th className="px-4 py-3">File Path</th>
                  <th className="px-4 py-3 text-center">Functions</th>
                  <th className="px-4 py-3 text-center">Avg CC</th>
                  <th className="px-4 py-3 text-center">Max CC</th>
                  <th className="px-4 py-3 text-center">Avg MI</th>
                  <th className="px-4 py-3 text-center">Est. Bugs</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {paginatedFileRows.length > 0 ? (
                  paginatedFileRows.map((r) => (
                    <tr key={r.filePath} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300 max-w-[340px] truncate" title={r.filePath}>
                        {r.filePath}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-200">{r.totalFunctions}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-300">{r.averageComplexity.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-100">{r.maxComplexity}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-300">
                        {r.averageMaintainability.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-300">{r.estimatedBugs.toFixed(3)}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={r.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">No file data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {totalFilePages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-900 bg-slate-950/60 px-4 py-2.5 no-print">
              <span className="text-[11px] font-medium text-slate-500 font-mono">
                Page {filePage} of {totalFilePages} (files { (filePage - 1) * filesPerPage + 1 } – { Math.min(filePage * filesPerPage, fileRows.length) } of {fileRows.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={filePage === 1}
                  onClick={() => setFilePage((p) => Math.max(1, p - 1))}
                  className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={filePage === totalFilePages}
                  onClick={() => setFilePage((p) => Math.min(totalFilePages, p + 1))}
                  className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Charts Tab */}
      {tab === "charts" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <SimpleBarChart title="Top 8 Cyclomatic Complexity (McCabe)" items={topComplexity} />
          <SimpleBarChart title="Top 8 Halstead Mental Effort" items={topEffort} />
        </div>
      ) : null}
    </section>
  );
}
