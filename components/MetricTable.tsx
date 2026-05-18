"use client";

import type { FunctionReport } from "@/types/analysis";
import FunctionDetail from "@/components/FunctionDetail";
import { useState, useMemo, useEffect } from "react";

function pill(status: FunctionReport["complexityStatus"]) {
  if (status === "good") return "bg-sky-500/10 text-sky-400 border-sky-500/20";
  if (status === "medium") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

export default function MetricTable({ rows }: { rows: FunctionReport[] }) {
  const [selected, setSelected] = useState<FunctionReport | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset to first page when search filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.functionName.toLowerCase().includes(q) ||
        r.filePath.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  return (
    <div className="space-y-3">
      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search functions or files..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-slate-700"
          />
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          Showing {filteredRows.length} functions
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="border-b border-slate-900 bg-slate-900/40">
              <tr className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                <th className="px-4 py-3">File Path</th>
                <th className="px-4 py-3">Function Name</th>
                <th className="px-4 py-3 text-center">Complexity (CC)</th>
                <th className="px-4 py-3 text-center font-mono">Volume (HV)</th>
                <th className="px-4 py-3 text-center">Maintainability Index (MI)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((r) => (
                  <tr
                    key={`${r.filePath}:${r.functionName}:${r.startLine ?? 0}`}
                    className="cursor-pointer hover:bg-slate-900/35 transition-colors group"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-3 font-mono text-slate-400 max-w-[280px] truncate" title={r.filePath}>
                      {r.filePath}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {r.functionName}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-slate-100">{r.cyclomatic}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-300">{Math.round(r.halstead.volume)}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-300">{Math.round(r.maintainabilityScore)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider",
                          pill(r.complexityStatus),
                        ].join(" ")}
                      >
                        {r.complexityStatus === "good" ? "SAFE" : r.complexityStatus === "medium" ? "WARNING" : "CRITICAL"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching functions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Minimalist Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-900 bg-slate-950/60 px-4 py-2.5">
            <span className="text-[11px] font-medium text-slate-500 font-mono">
              Page {currentPage} of {totalPages} (functions { (currentPage - 1) * itemsPerPage + 1 } – { Math.min(currentPage * itemsPerPage, filteredRows.length) } of {filteredRows.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-[11px] text-slate-500 px-1 no-print">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span>Tip: Click any row to view structural Control Flow Graph, AST nodes breakdown, and metrics details.</span>
      </div>

      {selected ? <FunctionDetail fn={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}


