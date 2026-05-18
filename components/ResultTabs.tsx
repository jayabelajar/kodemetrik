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

function overallStatus(avgComplexity: number): "Good" | "Medium" | "High" {
  if (avgComplexity <= 10) return "Good";
  if (avgComplexity <= 20) return "Medium";
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="mt-3 space-y-2">
        {items.map((i) => (
          <div key={i.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="truncate text-xs font-mono text-zinc-300">{i.label}</div>
              <div className="mt-1 h-2 overflow-hidden rounded bg-zinc-900">
                <div
                  className="h-2 rounded bg-emerald-400"
                  style={{ width: `${Math.max(2, Math.round((i.value / max) * 100))}%` }}
                />
              </div>
            </div>
            <div className="text-xs font-semibold text-zinc-200">{Math.round(i.value)}</div>
          </div>
        ))}
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
  const cls =
    status === "good"
      ? "bg-emerald-400/15 text-emerald-200 border-emerald-400/20"
      : status === "medium"
        ? "bg-amber-400/15 text-amber-200 border-amber-400/20"
        : "bg-red-400/15 text-red-200 border-red-400/20";
  return (
    <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls].join(" ")}>
      {status.toUpperCase()}
    </span>
  );
}

export default function ResultTabs({ report }: { report: AnalysisReport }) {
  const [tab, setTab] = useState<"overview" | "functions" | "files" | "charts">("overview");

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

  const topComplexity = useMemo(
    () =>
      [...report.functions]
        .sort((a, b) => b.cyclomatic - a.cyclomatic)
        .slice(0, 10)
        .map((f) => ({ label: `${f.filePath}:${f.functionName}`, value: f.cyclomatic })),
    [report.functions],
  );

  const topEffort = useMemo(
    () =>
      [...report.functions]
        .sort((a, b) => b.halstead.effort - a.halstead.effort)
        .slice(0, 10)
        .map((f) => ({ label: `${f.filePath}:${f.functionName}`, value: f.halstead.effort })),
    [report.functions],
  );

  const overall = overallStatus(report.summary.averageComplexity);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["overview", "Overview"],
            ["functions", "Functions"],
            ["files", "Files"],
            ["charts", "Charts"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              "rounded-lg border px-3 py-2 text-sm font-semibold",
              tab === id
                ? "border-zinc-200 bg-zinc-50 text-zinc-950"
                : "border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-6">
            <ResultCard label="Total Files" value={String(report.summary.totalFiles)} />
            <ResultCard label="Total Functions" value={String(report.summary.totalFunctions)} />
            <ResultCard label="Avg Complexity" value={report.summary.averageComplexity.toFixed(2)} hint="Cyclomatic" />
            <ResultCard
              label="High Risk"
              value={String(highRiskFunctions)}
              hint="High cyclomatic or risk≥75"
            />
            <ResultCard label="Estimated Bugs" value={estimatedBugs.toFixed(2)} hint="Halstead sum" />
            <ResultCard label="Overall" value={overall} hint="Based on avg complexity" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-semibold text-zinc-100">Status Distribution</div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2">
                  <span className="text-xs font-semibold text-zinc-400">GOOD</span>{" "}
                  <span className="font-semibold text-zinc-100">{statusCounts.good}</span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2">
                  <span className="text-xs font-semibold text-zinc-400">MEDIUM</span>{" "}
                  <span className="font-semibold text-zinc-100">{statusCounts.medium}</span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2">
                  <span className="text-xs font-semibold text-zinc-400">HIGH</span>{" "}
                  <span className="font-semibold text-zinc-100">{statusCounts.high}</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Klik tab Functions untuk detail per function + CFG.
              </div>
            </div>

            {report.recommendations.length > 0 ? (
              <div className="md:col-span-2">
                <div className="text-sm font-semibold text-zinc-100">Recommendations</div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {report.recommendations.map((r) => (
                    <div key={r} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-200">
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                Tidak ada rekomendasi global.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "functions" ? (
        <div className="space-y-2">
          <MetricTable rows={report.functions} />
          <div className="text-xs text-zinc-500">Klik baris function untuk melihat detail metrik dan CFG.</div>
        </div>
      ) : null}

      {tab === "files" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-950">
                <tr className="text-left text-xs font-semibold tracking-wide text-zinc-400">
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Functions</th>
                  <th className="px-4 py-3">Avg Cyclomatic</th>
                  <th className="px-4 py-3">Max Cyclomatic</th>
                  <th className="px-4 py-3">Avg MI</th>
                  <th className="px-4 py-3">Est. Bugs</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-950/30">
                {fileRows.map((r) => (
                  <tr key={r.filePath} className="border-t border-zinc-800">
                    <td className="max-w-[420px] truncate px-4 py-3 font-mono text-xs text-zinc-300">{r.filePath}</td>
                    <td className="px-4 py-3 text-zinc-100">{r.totalFunctions}</td>
                    <td className="px-4 py-3 text-zinc-100">{r.averageComplexity.toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-100">{r.maxComplexity}</td>
                    <td className="px-4 py-3 text-zinc-200">{Math.round(r.averageMaintainability)}</td>
                    <td className="px-4 py-3 text-zinc-200">{r.estimatedBugs.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "charts" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <SimpleBarChart title="Top 10 Cyclomatic Complexity" items={topComplexity} />
          <SimpleBarChart title="Top 10 Halstead Effort" items={topEffort} />
        </div>
      ) : null}
    </section>
  );
}

