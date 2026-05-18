"use client";

import { useCallback, useRef } from "react";
import type { AnalyzeInput } from "@/types/analysis";
import { detectLanguageFromPath } from "@/lib/analyzer/detectLanguage";

async function readFileContent(file: File): Promise<string> {
  return await file.text();
}

export default function FolderUpload({ onFiles }: { onFiles: (files: AnalyzeInput[]) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      onFiles(mapped);
    },
    [onFiles],
  );

  return (
    <section className="space-y-2">
      <div className="text-sm font-semibold">Upload folder</div>
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-6">
        <button
          type="button"
          onClick={onClick}
          className="rounded-lg bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white"
        >
          Select folder
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onChange}
          className="hidden"
          // @ts-expect-error - non-standard but widely supported
          webkitdirectory=""
        />
        <div className="mt-2 text-xs text-zinc-500">
          Browser akan membaca semua file dalam folder. File non .js/.php di-skip.
        </div>
      </div>
    </section>
  );
}

