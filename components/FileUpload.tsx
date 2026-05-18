"use client";

import { useCallback } from "react";
import type { AnalyzeInput } from "@/types/analysis";
import { detectLanguageFromPath } from "@/lib/analyzer/detectLanguage";

async function readFileContent(file: File): Promise<string> {
  return await file.text();
}

export default function FileUpload({ onFiles }: { onFiles: (files: AnalyzeInput[]) => void }) {
  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files ? Array.from(e.target.files) : [];
      const mapped: AnalyzeInput[] = [];
      for (const f of fileList) {
        const lang = detectLanguageFromPath(f.name);
        if (!lang) continue;
        mapped.push({ path: f.name, language: lang, content: await readFileContent(f) });
      }
      onFiles(mapped);
    },
    [onFiles],
  );

  return (
    <section className="space-y-2">
      <div className="text-sm font-semibold">Upload file</div>
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-6">
        <input
          type="file"
          multiple
          accept=".js,.mjs,.cjs,.jsx,.ts,.tsx,.php"
          onChange={onChange}
          className="block w-full text-sm text-zinc-200 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 hover:file:bg-white"
        />
        <div className="mt-2 text-xs text-zinc-500">MVP: .js/.php (TypeScript opsional).</div>
      </div>
    </section>
  );
}

