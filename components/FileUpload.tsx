"use client";

import { useCallback, useState } from "react";
import type { AnalyzeInput } from "@/types/analysis";
import { detectLanguageFromPath } from "@/lib/analyzer/detectLanguage";

async function readFileContent(file: File): Promise<string> {
  return await file.text();
}

export default function FileUpload({ onFiles }: { onFiles: (files: AnalyzeInput[]) => void }) {
  const [selectedCount, setSelectedCount] = useState(0);

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files ? Array.from(e.target.files) : [];
      const mapped: AnalyzeInput[] = [];
      for (const f of fileList) {
        const lang = detectLanguageFromPath(f.name);
        if (!lang) continue;
        mapped.push({ path: f.name, language: lang, content: await readFileContent(f) });
      }
      setSelectedCount(mapped.length);
      onFiles(mapped);
    },
    [onFiles],
  );

  return (
    <section className="space-y-2">
      <div className="relative group rounded-xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center transition-all hover:border-slate-700 hover:bg-slate-900/10">
        <input
          type="file"
          multiple
          accept=".js,.mjs,.cjs,.jsx,.ts,.tsx,.php"
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 group-hover:text-blue-400 group-hover:border-slate-700 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-200">
              {selectedCount > 0 ? (
                <span className="text-blue-400">Successfully loaded {selectedCount} files!</span>
              ) : (
                "Drag & drop code files here, or click to browse"
              )}
            </p>
            <p className="text-[10px] text-slate-500">
              Supports JavaScript (.js, .jsx) and PHP (.php) files
            </p>
          </div>

          <button
            type="button"
            className="rounded border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-300 pointer-events-none group-hover:bg-slate-800 transition-colors"
          >
            Select Files
          </button>
        </div>
      </div>

    </section>
  );
}
