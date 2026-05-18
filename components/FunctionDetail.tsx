"use client";

import { useMemo, useState } from "react";
import type { FunctionReport } from "@/types/analysis";
import MermaidDiagram from "@/components/MermaidDiagram";

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="text-xs font-semibold text-zinc-400">{k}</div>
      <div className="mt-1 font-mono text-sm text-zinc-100">{v}</div>
    </div>
  );
}

export default function FunctionDetail({
  fn,
  onClose,
}: {
  fn: FunctionReport;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "cyclomatic" | "halstead" | "cfg">("overview");
  const halstead = fn.halstead;
  const breakdown = fn.cyclomaticBreakdown;

  const halsteadRows = useMemo(
    () => [
      ["n1 distinct operators", String(halstead.distinctOperators)],
      ["n2 distinct operands", String(halstead.distinctOperands)],
      ["N1 total operators", String(halstead.totalOperators)],
      ["N2 total operands", String(halstead.totalOperands)],
      ["vocabulary", String(halstead.vocabulary)],
      ["length", String(halstead.length)],
      ["volume", halstead.volume.toFixed(2)],
      ["difficulty", halstead.difficulty.toFixed(2)],
      ["effort", halstead.effort.toFixed(2)],
      ["estimated bugs", halstead.estimatedBugs.toFixed(4)],
      [
        "time to program (s)",
        typeof halstead.timeToProgramSeconds === "number" ? halstead.timeToProgramSeconds.toFixed(0) : "-",
      ],
    ],
    [halstead],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 md:p-10" role="dialog" aria-modal="true">
      <div className="mx-auto h-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-zinc-400">FUNCTION DETAIL</div>
            <div className="mt-1 text-lg font-semibold text-zinc-50">
              {fn.functionName}{" "}
              <span className="text-sm font-normal text-zinc-400">
                ({fn.filePath}
                {fn.startLine ? `:${fn.startLine}` : ""})
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Cyclomatic {fn.cyclomatic} • Maintainability {fn.maintainabilityScore.toFixed(0)} • Risk{" "}
              {typeof fn.riskScore === "number" ? fn.riskScore.toFixed(0) : "-"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 p-3">
          {(
            [
              ["overview", "Overview"],
              ["cyclomatic", "Cyclomatic"],
              ["halstead", "Halstead"],
              ["cfg", "CFG"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "rounded-lg border px-3 py-2 text-sm font-semibold",
                tab === id
                  ? "border-zinc-200 bg-zinc-50 text-zinc-950"
                  : "border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-[calc(100%-124px)] overflow-y-auto p-4">
          {tab === "overview" ? (
            <div className="grid gap-3 md:grid-cols-3">
              <Stat k="File" v={fn.filePath} />
              <Stat k="Lines" v={fn.loc ? String(fn.loc) : "-"} />
              <Stat k="Status" v={fn.complexityStatus.toUpperCase()} />
              <Stat k="Cyclomatic" v={String(fn.cyclomatic)} />
              <Stat k="Halstead Volume" v={fn.halstead.volume.toFixed(2)} />
              <Stat k="Halstead Effort" v={fn.halstead.effort.toFixed(2)} />
            </div>
          ) : null}

          {tab === "cyclomatic" ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Stat k="Score" v={String(fn.cyclomatic)} />
                <Stat k="Status" v={fn.complexityStatus.toUpperCase()} />
                <Stat k="Breakdown" v={breakdown ? "available" : "n/a"} />
              </div>
              {breakdown ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <Stat k="if" v={String(breakdown.if)} />
                  <Stat k="else if" v={String(breakdown.elseIf)} />
                  <Stat k="for" v={String(breakdown.for)} />
                  <Stat k="for..in" v={String(breakdown.forIn)} />
                  <Stat k="for..of" v={String(breakdown.forOf)} />
                  <Stat k="while" v={String(breakdown.while)} />
                  <Stat k="do..while" v={String(breakdown.doWhile)} />
                  <Stat k="switch/case" v={String(breakdown.switchCase)} />
                  <Stat k="catch" v={String(breakdown.catch)} />
                  <Stat k="ternary" v={String(breakdown.ternary)} />
                  <Stat k="&&" v={String(breakdown.and)} />
                  <Stat k="||" v={String(breakdown.or)} />
                </div>
              ) : (
                <div className="text-sm text-zinc-400">Breakdown detail tidak tersedia untuk function ini.</div>
              )}
            </div>
          ) : null}

          {tab === "halstead" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {halsteadRows.map(([k, v]) => (
                <Stat key={k} k={k} v={v} />
              ))}
            </div>
          ) : null}

          {tab === "cfg" ? (
            <div className="space-y-3">
              {fn.cfg?.mermaid ? (
                <>
                  <MermaidDiagram definition={fn.cfg.mermaid} />
                  <details className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-zinc-100">
                      Mermaid source
                    </summary>
                    <pre className="mt-3 overflow-x-auto text-xs text-zinc-200">{fn.cfg.mermaid}</pre>
                  </details>
                </>
              ) : (
                <div className="text-sm text-zinc-400">CFG tidak tersedia untuk function ini.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
