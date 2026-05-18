"use client";

import type { LanguageId } from "@/types/analysis";

export default function CodeEditor({
  language,
  value,
  onChange,
}: {
  language: LanguageId;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between">
        <div className="text-sm font-semibold">Source code</div>
        <div className="text-xs text-zinc-500">{language === "php" ? "PHP" : "JavaScript"}</div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          language === "php"
            ? "<?php\n\nfunction foo($a) {\n  if ($a) return 1;\n  return 0;\n}\n"
            : "function foo(a) {\n  if (a) return 1;\n  return 0;\n}\n"
        }
        className="h-[360px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[13px] leading-relaxed text-zinc-100 outline-none focus:border-zinc-500"
      />
      <div className="text-xs text-zinc-500">
        Tip: untuk hasil lebih akurat, paste file per bahasa (JS/PHP) dan hindari campuran.
      </div>
    </section>
  );
}

