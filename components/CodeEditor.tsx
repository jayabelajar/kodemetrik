"use client";

import type { LanguageId } from "@/types/analysis";
import { useState } from "react";

export default function CodeEditor({
  language,
  value,
  onChange,
}: {
  language: LanguageId;
  value: string;
  onChange: (v: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="space-y-2">
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* IDE-like Header Tab Bar */}
        <div className="flex items-center justify-between border-b border-slate-900 bg-slate-900/40 px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Visual Red/Yellow/Green Window Dots */}
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
            </div>
            <span className="h-4 w-px bg-slate-800 mx-2" />
            
            {/* File Tab */}
            <div className="flex items-center gap-1.5 rounded-t-md bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-300 border-t border-x border-slate-800/80 -mb-[9px] relative z-10">
              {language === "javascript" ? (
                <span className="text-[10px] font-bold text-yellow-500 font-mono">JS</span>
              ) : (
                <span className="text-[10px] font-bold text-blue-400 font-mono">PHP</span>
              )}
              <span className="font-mono text-slate-300 text-[11px]">
                index.{language === "php" ? "php" : "js"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase">
              {language === "php" ? "PHP AST PARSER" : "BABEL AST PARSER"}
            </span>
            {value.trim() && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded border border-slate-800 bg-slate-900/60 px-2 py-0.5 font-mono text-[10px] text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        </div>

        {/* Text Area Input */}
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              language === "php"
                ? "<?php\n\nfunction calculateTax($amount, $taxRate) {\n  if ($amount <= 0) {\n    return 0;\n  }\n  \n  $tax = $amount * $taxRate;\n  return $tax;\n}\n"
                : "function calculateTax(amount, taxRate) {\n  if (amount <= 0) {\n    return 0;\n  }\n  \n  const tax = amount * taxRate;\n  return tax;\n}\n"
            }
            className="h-[380px] w-full resize-none bg-slate-950 p-6 font-mono text-xs leading-relaxed text-slate-100 outline-none placeholder:text-slate-700"
          />
          
          {/* Subtle line counter or status */}
          <div className="absolute bottom-2 right-4 pointer-events-none font-mono text-[10px] text-slate-600">
            {value ? `${value.split("\n").length} lines` : "0 lines"}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span>Tip: Paste functions or whole files. Mixed languages are ignored during parsing.</span>
      </div>

    </section>
  );
}
