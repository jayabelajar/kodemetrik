"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CodeEditor from "@/components/CodeEditor";
import FileUpload from "@/components/FileUpload";
import FolderUpload from "@/components/FolderUpload";
import type { AnalyzeInput, AnalysisReport, LanguageId } from "@/types/analysis";
import { analyzeInputs } from "@/lib/analyzer/analyze";

const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 100;

export default function AnalyzerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "file" | "folder">("paste");
  const [language, setLanguage] = useState<LanguageId>("php");
  const [code, setCode] = useState<string>("");
  const [inputs, setInputs] = useState<AnalyzeInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // States for custom confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingInputs, setPendingInputs] = useState<AnalyzeInput[]>([]);

  // Local storage history state
  const [history, setHistory] = useState<any[]>([]);

  const totalBytes = useMemo(
    () => inputs.reduce((sum, f) => sum + (f.content?.length ?? 0), 0),
    [inputs],
  );

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("codemetrik_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  // Auto-dismiss custom toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  function resetResults() {
    setError(null);
  }

  async function runAnalysisWithInputs(selectedInputs: AnalyzeInput[]) {
    resetResults();
    setIsRunning(true);
    try {
      if (selectedInputs.length === 0) {
        const msg = "No source code to analyze. Please paste code or upload files.";
        setError(msg);
        showToast(msg, "error");
        return;
      }
      if (selectedInputs.length > MAX_FILES) {
        const msg = `Limit exceeded: Maximum ${MAX_FILES} files allowed.`;
        setError(msg);
        showToast(msg, "error");
        return;
      }
      
      const selectedBytes = selectedInputs.reduce((sum, f) => sum + (f.content?.length ?? 0), 0);
      if (selectedBytes > MAX_TOTAL_BYTES) {
        const msg = "Limit exceeded: Total code file size exceeds 5MB.";
        setError(msg);
        showToast(msg, "error");
        return;
      }

      // Simulate a small delay for premium developer tool loading feedback
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = await analyzeInputs(selectedInputs);

      // Save to local storage history
      try {
        const stored = localStorage.getItem("codemetrik_history");
        const historyList = stored ? JSON.parse(stored) : [];
        const newHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          fileNameSummary: selectedInputs.length > 0
            ? selectedInputs[0].path + (selectedInputs.length > 1 ? ` (+${selectedInputs.length - 1} files)` : "")
            : `Pasted Code (${language === "php" ? "PHP" : "JS"})`,
          language: selectedInputs[0]?.language ?? "javascript",
          fileCount: selectedInputs.length,
          averageComplexity: result.functions.length > 0
            ? result.functions.reduce((s, f) => s + f.cyclomatic, 0) / result.functions.length
            : 0,
          report: result,
        };
        const updated = [newHistoryItem, ...historyList].slice(0, 10);
        localStorage.setItem("codemetrik_history", JSON.stringify(updated));
        localStorage.setItem("codemetrik_latest_result_id", newHistoryItem.id);
        setHistory(updated);
        showToast("Analysis complete! Opening results…", "success");
        router.push(`/results?id=${newHistoryItem.id}`);
      } catch (historyErr) {
        console.error("Failed to save history:", historyErr);
        // Fallback: still open results using in-memory report.
        localStorage.setItem("codemetrik_latest_report", JSON.stringify(result));
        showToast("Analysis complete! Opening results…", "success");
        router.push("/results");
      }

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to analyze code.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsRunning(false);
    }
  }

  async function onAnalyze() {
    const selectedInputs: AnalyzeInput[] =
      mode === "paste"
        ? [{ path: `pasted.${language === "php" ? "php" : "js"}`, language, content: code }]
        : inputs;
    await runAnalysisWithInputs(selectedInputs);
  }

  return (
    <main className="space-y-8 animate-fade-in relative">
      {/* Title & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-5">
        <div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-100">
            Source Code Analyzer
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Calculate branch complexity scores, operator density, and draw structural flow graphs instantly.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:border-slate-700 hover:text-white no-print"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Overview
          </Link>
        </div>
      </div>

      {/* Control panel Grid */}
      <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 md:grid-cols-[1fr_1fr_auto] items-end backdrop-blur-sm shadow-xl shadow-black/20 no-print">
        
        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-500"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Analysis Input Mode
          </label>
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-900">
            {(["paste", "file", "folder"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  resetResults();
                }}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 px-3 text-xs font-semibold transition-all duration-150",
                  mode === m
                    ? "bg-slate-900 text-slate-50 border border-slate-800/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30",
                ].join(" ")}
              >
                {m === "paste" && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                )}
                {m === "file" && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                )}
                {m === "folder" && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>
                )}
                {m === "paste" ? "Paste Code" : m === "file" ? "Upload File" : "Upload Folder"}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-500"
            >
              <path d="m5 8 6 6 6-6" />
              <path d="m4 14 6 6 8-8" />
            </svg>
            Programming Language
          </label>
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-900">
            {(
              [
                { id: "php", label: "PHP" },
                { id: "javascript", label: "JavaScript" },
              ] as const
            ).map((l) => {
              const disabled = mode !== "paste";
              return (
                <button
                  key={l.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setLanguage(l.id);
                    resetResults();
                  }}
                  className={[
                    "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 px-3 text-xs font-semibold transition-all duration-150",
                    language === l.id && mode === "paste"
                      ? "bg-slate-900 text-slate-50 border border-slate-800/60 shadow-sm"
                      : "text-slate-400 hover:text-slate-200",
                    disabled ? "opacity-30 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {l.id === "javascript" ? (
                    <span className="font-bold text-[10px] bg-yellow-400/10 text-yellow-500 px-1 rounded">JS</span>
                  ) : (
                    <span className="font-bold text-[10px] bg-blue-400/10 text-blue-400 px-1 rounded">PHP</span>
                  )}
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isRunning}
            className="w-full relative inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] h-[38px]"
          >
            {isRunning ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing AST...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                Run Diagnosis
              </>
            )}
          </button>
        </div>
      </section>

      {/* Side-by-Side Workspace and Riwayat Analisis */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        
        {/* Workspace Column */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-900 bg-slate-950 p-1 no-print">
            {mode === "paste" ? (
              <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} />
            ) : mode === "file" ? (
              <FileUpload
                onFiles={async (files) => {
                  if (files.length > 0) {
                    setPendingInputs(files);
                    setShowConfirmModal(true);
                  }
                }}
              />
            ) : (
              <FolderUpload
                onFiles={async (files) => {
                  if (files.length > 0) {
                    setPendingInputs(files);
                    setShowConfirmModal(true);
                  }
                }}
              />
            )}
          </section>

          {/* Limits & Help info */}
          {mode !== "paste" && inputs.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/10 px-4 py-3 text-xs no-print">
              <div className="flex items-center gap-2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                <span>Loaded files: <strong className="text-slate-300 font-mono">{inputs.length}</strong> file(s) ({mode === "folder" ? "filtered by .js/.php" : ""})</span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Size: {(totalBytes / 1024).toFixed(1)} KB / 5.0 MB
              </div>
            </div>
          )}

          {/* Errors Panel */}
          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400 flex items-start gap-3 shadow-md no-print">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-0.5 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <div>
                <span className="font-semibold uppercase tracking-wider text-red-500 block mb-1">Analysis Failure</span>
                {error}
              </div>
            </div>
          ) : null}
        </div>

        {/* History Sidebar */}
        <aside className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4 shadow-xl no-print h-fit">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Analysis History
            </h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("codemetrik_history");
                  setHistory([]);
                  showToast("Analysis history cleared successfully.", "success");
                }}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider font-mono"
              >
                Clear All
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-700"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p className="text-[11px] text-slate-500 leading-relaxed">No analysis history found.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {history.map((item) => {
                const formattedTime = new Date(item.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={item.id}
                  onClick={() => {
                      localStorage.setItem("codemetrik_latest_result_id", item.id);
                      showToast(`Opening results: ${item.fileNameSummary}`, "success");
                      router.push(`/results?id=${item.id}`);
                    }}
                    className="group border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-800 p-3 rounded-lg cursor-pointer transition-all space-y-1.5 animate-fade-in"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-350 border border-slate-800">
                        {item.language === "php" ? "PHP" : "JS"}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {formattedTime}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-350 group-hover:text-white truncate">
                      {item.fileNameSummary}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-900/50">
                      <span>Complexity: <strong className="text-slate-400 font-mono">CC {item.averageComplexity.toFixed(1)}</strong></span>
                      <span>{item.fileCount} {item.fileCount === 1 ? "file" : "files"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {/* Premium Vercel-style Toast Notification Popup */}
      {toast && (
        <div 
          className="fixed bottom-5 right-5 z-50 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-black/85 max-w-sm animate-fade-in-up transition-all duration-300"
          role="alert"
        >
          {toast.type === "success" ? (
            <div className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/10 text-sky-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </div>
          )}
          <div className="flex-1 space-y-0.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-350 font-mono">
              {toast.type === "success" ? "Success" : "Validation Alert"}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed pr-2">
              {toast.message}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Close notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Custom HTML Dialog Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
            onClick={() => setShowConfirmModal(false)}
          />
          
          {/* Dialog Container */}
          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/80 transition-all duration-300 transform scale-100 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-tight text-slate-100 font-mono uppercase">
                  Files Loaded Successfully
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We found <strong className="text-slate-200 font-mono">{pendingInputs.length}</strong> source code files ready for analysis. Do you want to run the complexity scan immediately?
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setInputs(pendingInputs);
                  setShowConfirmModal(false);
                  showToast(`Loaded ${pendingInputs.length} files successfully!`, "success");
                }}
                className="rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-350 transition-colors hover:border-slate-700 hover:text-white"
              >
                No, Review Files
              </button>
              <button
                type="button"
                onClick={async () => {
                  setInputs(pendingInputs);
                  setShowConfirmModal(false);
                  await runAnalysisWithInputs(pendingInputs);
                }}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                Yes, Run Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
