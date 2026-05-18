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
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "dark" });
        const { svg } = await mermaid.render(id, definition);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) setSvg(`<pre>${String(e)}</pre>`);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [definition, id]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="min-w-[520px]" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

