"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const EXPORT_SCALE = 4;

export default function MermaidDiagram({ definition }: { definition: string }) {
  const [svg, setSvg] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [hotkeysActive, setHotkeysActive] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);

  const panRef = useRef<HTMLDivElement | null>(null);
  const panState = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const id = useMemo(() => `mmd-${Math.random().toString(16).slice(2)}`, []);

  function setZoomStepped(nextZoom: number) {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom));
    setZoom(Math.round(clamped / ZOOM_STEP) * ZOOM_STEP);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function inferSvgSize(svgText: string): { width: number; height: number } {
    // Prefer parsing the SVG attributes (handles width="100%" cases).
    try {
      const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (svgEl) {
        const viewBox = svgEl.getAttribute("viewBox");
        const widthAttr = svgEl.getAttribute("width");
        const heightAttr = svgEl.getAttribute("height");

        const viewBoxNums = viewBox
          ? viewBox
              .trim()
              .split(/[\s,]+/)
              .map((n) => Number(n))
              .filter((n) => Number.isFinite(n))
          : [];

        const vbW = viewBoxNums.length === 4 ? viewBoxNums[2] : undefined;
        const vbH = viewBoxNums.length === 4 ? viewBoxNums[3] : undefined;

        const w = widthAttr && /^\d+(\.\d+)?$/.test(widthAttr.trim()) ? Number(widthAttr) : undefined;
        const h = heightAttr && /^\d+(\.\d+)?$/.test(heightAttr.trim()) ? Number(heightAttr) : undefined;

        const width = Math.max(1, Math.round(w ?? vbW ?? 1400));
        const height = Math.max(1, Math.round(h ?? vbH ?? 900));
        return { width, height };
      }
    } catch {
      // fall through
    }

    // Fallback heuristic regex.
    let width = 1400;
    let height = 900;
    const viewBoxMatch = svgText.match(/\bviewBox\s*=\s*["']([\d.\s,]+)["']/i);
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1]
        .trim()
        .split(/[\s,]+/)
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n));
      if (parts.length === 4) {
        width = Math.max(1, Math.round(parts[2]));
        height = Math.max(1, Math.round(parts[3]));
      }
    }
    return { width, height };
  }

  function normalizeSvg(svgText: string) {
    // Ensure xmlns for serialization & rasterization.
    if (!/\bxmlns=/.test(svgText)) {
      return svgText.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return svgText;
  }

  async function svgToPngBlob(svgText: string, scale = EXPORT_SCALE): Promise<{ blob: Blob; width: number; height: number }> {
    const normalized = normalizeSvg(svgText);
    const { width, height } = inferSvgSize(normalized);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load SVG image for export"));
      });
      const encoded = encodeURIComponent(normalized).replace(/%0A/g, "").replace(/%20/g, " ");
      img.src = `data:image/svg+xml;charset=utf-8,${encoded}`;
      await loaded;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context not available");

      // White background.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Higher-quality downscaling (if any) and sharper edges at high res.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))), "image/png");
      });

      return { blob, width: canvas.width, height: canvas.height };
    } finally {
      // no-op
    }
  }

  async function exportPng() {
    if (!svg) return;
    setIsExporting(true);
    try {
      const { blob } = await svgToPngBlob(svg, EXPORT_SCALE);
      downloadBlob(blob, "cfg.png");
    } finally {
      setIsExporting(false);
    }
  }

  async function exportPdf() {
    if (!svg) return;
    setIsExporting(true);
    try {
      const { blob, width, height } = await svgToPngBlob(svg, EXPORT_SCALE);
      const pngBytes = new Uint8Array(await blob.arrayBuffer());

      const pdf = await PDFDocument.create();
      const pngImage = await pdf.embedPng(pngBytes);

      // Fit image into an A4 landscape page (points). Keeps output crisp while being viewable/printable.
      const pageWidth = 842; // A4 landscape width in points (approx)
      const pageHeight = 595; // A4 landscape height in points (approx)
      const page = pdf.addPage([pageWidth, pageHeight]);

      const margin = 24;
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;
      const scale = Math.min(maxW / width, maxH / height);
      const drawW = width * scale;
      const drawH = height * scale;
      const x = (pageWidth - drawW) / 2;
      const y = (pageHeight - drawH) / 2;
      page.drawImage(pngImage, { x, y, width: drawW, height: drawH });

      const pdfBytes = await pdf.save();
      // pdf-lib returns Uint8Array backed by ArrayBufferLike; cast to BlobPart for TS compatibility.
      downloadBlob(new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" }), "cfg.pdf");
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          // Disable <foreignObject> labels to avoid tainted canvas on export.
          flowchart: { htmlLabels: false },
          themeVariables: {
            background: "transparent",
            primaryColor: "#93c5fd",
            primaryTextColor: "#0f172a",
            lineColor: "#0f172a",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          },
        });
        const { svg } = await mermaid.render(id, definition);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) {
          setSvg(
            `<div class="text-xs text-red-400 font-mono bg-red-950/20 p-4 rounded border border-red-900/30">${String(
              e
            )}</div>`
          );
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [definition, id]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [definition]);

  useEffect(() => {
    if (!hotkeysActive) return;

    function onKeyDown(e: KeyboardEvent) {
      // Intentionally disabled: zoom should only be controlled by floating buttons.
      if (e.key === "0" || e.key === "-" || e.key === "_" || e.key === "+" || e.key === "=") return;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeysActive, zoom]);

  const canZoomOut = zoom > ZOOM_MIN;
  const canZoomIn = zoom < ZOOM_MAX;

  return (
    <div className="relative rounded-xl border border-slate-200/10 bg-slate-950 shadow-inner">
      {/* Floating controls: outside the scrollable/pannable area */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-950/90 px-1.5 py-1 backdrop-blur no-print">
        <button
          type="button"
          onClick={exportPng}
          disabled={isExporting || !svg}
          className="h-7 rounded-md border border-slate-800 bg-slate-900/40 px-2 font-mono text-[10px] text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-900/70 disabled:pointer-events-none disabled:opacity-30"
          title="Export PNG"
        >
          PNG
        </button>
        <button
          type="button"
          onClick={exportPdf}
          disabled={isExporting || !svg}
          className="h-7 rounded-md border border-slate-800 bg-slate-900/40 px-2 font-mono text-[10px] text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-900/70 disabled:pointer-events-none disabled:opacity-30"
          title="Export PDF"
        >
          PDF
        </button>
        <span className="mx-0.5 hidden h-5 w-px bg-slate-800 sm:inline-block" />
        <button
          type="button"
          disabled={!canZoomOut}
          onClick={() => setZoomStepped(zoom - ZOOM_STEP)}
          className="h-7 w-7 rounded-md border border-slate-800 bg-slate-900/40 text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-900/70 disabled:pointer-events-none disabled:opacity-30"
          title="Zoom out"
        >
          <span className="text-sm leading-none">−</span>
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="h-7 rounded-md border border-slate-800 bg-slate-900/40 px-2 font-mono text-[10px] text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-900/70"
          title="Reset zoom (Ctrl/⌘ 0)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          disabled={!canZoomIn}
          onClick={() => setZoomStepped(zoom + ZOOM_STEP)}
          className="h-7 w-7 rounded-md border border-slate-800 bg-slate-900/40 text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-900/70 disabled:pointer-events-none disabled:opacity-30"
          title="Zoom in"
        >
          <span className="text-sm leading-none">+</span>
        </button>
      </div>

      <div
        ref={panRef}
        tabIndex={0}
        className={[
          "relative group overflow-auto rounded-xl p-6 flex justify-center outline-none",
          "bg-white",
          "[background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)]",
          "[background-size:24px_24px]",
          isPanning ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
        onMouseEnter={() => setHotkeysActive(true)}
        onMouseLeave={() => setHotkeysActive(false)}
        onFocus={() => setHotkeysActive(true)}
        onBlur={() => setHotkeysActive(false)}
        onPointerDown={(e) => {
          const el = panRef.current;
          if (!el) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;

          panState.current = {
            active: true,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startPanX: pan.x,
            startPanY: pan.y,
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
          setPan({ x: state.startPanX + dx, y: state.startPanY + dy });
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
        <div
          className="min-w-[500px] transition-transform duration-150"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top left",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <div className="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono text-[9px] text-slate-500 bg-white/90 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
          Drag to pan · Zoom via buttons · Export PNG/PDF
        </div>
      </div>
    </div>
  );
}
