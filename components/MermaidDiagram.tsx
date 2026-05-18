"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function MermaidDiagram({ definition }: { definition: string }) {
  const [svg, setSvg] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<HTMLDivElement | null>(null);
  const panState = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
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

  useEffect(() => {
    // Reset zoom when definition changes (new graph).
    setZoom(1);
  }, [definition]);

  const canZoomOut = zoom > 0.4;
  const canZoomIn = zoom < 2.5;

  return (
    <div
      ref={panRef}
      className={[
        "relative group overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 flex justify-center shadow-inner",
        isPanning ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      onPointerDown={(e) => {
        // Don't start panning when clicking UI controls.
        const target = e.target as HTMLElement | null;
        if (target?.closest("[data-no-pan]")) return;
        const el = panRef.current;
        if (!el) return;
        // Only left mouse button for mouse; allow touch/pen.
        if (e.pointerType === "mouse" && e.button !== 0) return;

        panState.current = {
          active: true,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startScrollLeft: el.scrollLeft,
          startScrollTop: el.scrollTop,
        };
        setIsPanning(true);
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }}
      onPointerMove={(e) => {
        const state = panState.current;
        const el = panRef.current;
        if (!state?.active || !el) return;
        if (e.pointerId !== state.pointerId) return;
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        el.scrollLeft = state.startScrollLeft - dx;
        el.scrollTop = state.startScrollTop - dy;
      }}
      onPointerUp={(e) => {
        const state = panState.current;
        const el = panRef.current;
        if (state?.active && e.pointerId === state.pointerId) {
          state.active = false;
          panState.current = null;
          setIsPanning(false);
          try {
            el?.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        }
      }}
      onPointerCancel={() => {
        panState.current = null;
        setIsPanning(false);
      }}
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 px-1.5 py-1 backdrop-blur no-print">
        <button
          type="button"
          disabled={!canZoomOut}
          onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
          className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-900/40 text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 disabled:opacity-30 disabled:pointer-events-none"
          title="Zoom out"
          data-no-pan
        >
          <span className="text-sm leading-none">−</span>
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="h-7 rounded-md border border-zinc-800 bg-zinc-900/40 px-2 font-mono text-[10px] text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70"
          title="Reset zoom"
          data-no-pan
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          disabled={!canZoomIn}
          onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}
          className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-900/40 text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 disabled:opacity-30 disabled:pointer-events-none"
          title="Zoom in"
          data-no-pan
        >
          <span className="text-sm leading-none">+</span>
        </button>
      </div>

      <div
        className="min-w-[500px] transition-transform duration-150"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono text-[9px] text-zinc-600 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-900">
        Drag to pan · Scroll to pan · Zoom: +/- buttons
      </div>
    </div>
  );
}
