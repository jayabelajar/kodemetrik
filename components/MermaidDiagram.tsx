"use client";

import { useEffect, useMemo, useState } from "react";

export default function MermaidDiagram({ definition }: { definition: string }) {
  const [svg, setSvg] = useState<string>("");
  const id = useMemo(() => `mmd-${Math.random().toString(16).slice(2)}`, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ 
          startOnLoad: false, 
          securityLevel: "strict", 
          theme: "dark",
          themeVariables: {
            background: "#09090b",
            primaryColor: "#10b981",
            primaryTextColor: "#f4f4f5",
            lineColor: "#3f3f46",
          }
        });
        const { svg } = await mermaid.render(id, definition);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) setSvg(`<div class="text-xs text-red-400 font-mono bg-red-950/20 p-4 rounded border border-red-900/30">${String(e)}</div>`);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [definition, id]);

  return (
    <div className="relative group overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 flex justify-center shadow-inner">
      <div className="min-w-[500px] flex items-center justify-center scale-95 md:scale-100 transition-transform duration-300" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono text-[9px] text-zinc-600 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-900">
        Use Shift + Scroll to pan horizontally
      </div>
    </div>
  );
}

