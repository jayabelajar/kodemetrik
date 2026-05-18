"use client";

import { useCallback, useRef, useState } from "react";
import type { AnalyzeInput } from "@/types/analysis";
import { detectLanguageFromPath } from "@/lib/analyzer/detectLanguage";

async function readFileContent(file: File): Promise<string> {
  return await file.text();
}

export default function FolderUpload({ onFiles }: { onFiles: (files: AnalyzeInput[]) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);

  const onClick = useCallback(() => inputRef.current?.click(), []);

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files ? Array.from(e.target.files) : [];
      const mapped: AnalyzeInput[] = [];

      for (const f of fileList) {
        const relPath = (f as any).webkitRelativePath || f.name;
        const lang = detectLanguageFromPath(relPath);
        if (!lang) continue;
        mapped.push({ path: relPath, language: lang, content: await readFileContent(f) });
      }
      setLoadedCount(mapped.length);
      onFiles(mapped);
    },
    [onFiles],
  );

  return (
    <section className="space-y-2">
      <div 
        onClick={onClick}
        className="group relative rounded-xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center transition-all hover:border-slate-700 hover:bg-slate-900/10 cursor-pointer"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onChange}
          className="hidden"
          // @ts-expect-error - non-standard but widely supported
          webkitdirectory=""
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
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
              <polyline points="12 10 12 16 12 16" />
              <polyline points="9 13 12 10 15 13" />
            </svg>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-200">
              {loadedCount > 0 ? (
                <span className="text-blue-400">Folder loaded: found {loadedCount} matching files</span>
              ) : (
                "Select a folder to analyze all files recursively"
              )}
            </p>
            <p className="text-[10px] text-slate-500">
              Scans recursively and auto-filters for JavaScript and PHP source code
            </p>
          </div>

          <button
            type="button"
            className="rounded border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-300 group-hover:bg-slate-800 transition-colors"
          >
            Select Directory
          </button>
        </div>
      </div>

    </section>
  );
}
