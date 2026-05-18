"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CodeEditor from "@/components/CodeEditor";
import FileUpload from "@/components/FileUpload";
import FolderUpload from "@/components/FolderUpload";
import ResultTabs from "@/components/ResultTabs";
import type { AnalyzeInput, AnalysisReport, LanguageId } from "@/types/analysis";
import { analyzeInputs } from "@/lib/analyzer/analyze";

const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 100;

export default function AnalyzerPage() {
  const [mode, setMode] = useState<"paste" | "file" | "folder">("paste");
  const [language, setLanguage] = useState<LanguageId>("javascript");
  const [code, setCode] = useState<string>("");
  const [inputs, setInputs] = useState<AnalyzeInput[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const totalBytes = useMemo(
    () => inputs.reduce((sum, f) => sum + (f.content?.length ?? 0), 0),
    [inputs],
  );

  function resetResults() {
    setReport(null);
    setError(null);
  }

  async function onAnalyze() {
    resetResults();
    setIsRunning(true);
    try {
      const selectedInputs: AnalyzeInput[] =
        mode === "paste"
          ? [{ path: `pasted.${language === "php" ? "php" : "js"}`, language, content: code }]
          : inputs;

      if (selectedInputs.length === 0) {
        setError("Tidak ada input untuk dianalisis.");
        return;
      }
      if (selectedInputs.length > MAX_FILES) {
        setError(`Terlalu banyak file. Maks ${MAX_FILES} file.`);
        return;
      }
      if (totalBytes > MAX_TOTAL_BYTES) {
        setError(`Ukuran total melebihi 5MB.`);
        return;
      }

      const result = await analyzeInputs(selectedInputs);
      setReport(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menganalisis.";
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-zinc-400">ANALYZER</div>
          <h2 className="mt-1 text-2xl font-semibold">Analyze code</h2>
          <p className="mt-1 text-sm text-zinc-300">Paste code, upload file, atau upload folder.</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-zinc-200 hover:text-white">
          ← Back
        </Link>
      </div>

      <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:grid-cols-3">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-400">Mode</div>
          <div className="flex flex-wrap gap-2">
            {(["paste", "file", "folder"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  resetResults();
                }}
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-semibold",
                  mode === m
                    ? "border-zinc-200 bg-zinc-50 text-zinc-950"
                    : "border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900",
                ].join(" ")}
              >
                {m === "paste" ? "Paste Code" : m === "file" ? "Upload File" : "Upload Folder"}
              </button>
            ))}
          </div>
          <div className="pt-2 text-xs text-zinc-400">Limit MVP: max 100 file, max 5MB total.</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-400">Language</div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "javascript", label: "JavaScript" },
                { id: "php", label: "PHP" },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setLanguage(l.id);
                  resetResults();
                }}
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-semibold",
                  language === l.id
                    ? "border-zinc-200 bg-zinc-50 text-zinc-950"
                    : "border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900",
                ].join(" ")}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-500">
            {mode === "paste"
              ? "Mode paste mengikuti language ini."
              : "Untuk upload, language ditentukan dari ekstensi."}
          </div>
        </div>

        <div className="flex items-end justify-end">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isRunning}
            className="w-full rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-300 disabled:opacity-50 md:w-auto"
          >
            {isRunning ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </section>

      {mode === "paste" ? (
        <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} />
      ) : mode === "file" ? (
        <FileUpload
          onFiles={async (files) => {
            resetResults();
            setInputs(files);
          }}
        />
      ) : (
        <FolderUpload
          onFiles={async (files) => {
            resetResults();
            setInputs(files);
          }}
        />
      )}

      {error ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {report ? (
        <ResultTabs report={report} />
      ) : null}
    </main>
  );
}
