"use client";

import { useMemo } from "react";
import type { FunctionReport } from "@/types/analysis";
import MermaidDiagram from "@/components/MermaidDiagram";

function StatCard({ k, v, desc }: { k: string; v: string; desc?: string }) {
  return (
    <div className="group relative rounded-xl border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-slate-700 shadow-md">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</div>
      <div className="mt-1.5 font-mono text-lg font-bold text-slate-100">{v}</div>
      {desc ? <div className="mt-1 text-[9px] text-slate-500 font-medium leading-tight">{desc}</div> : null}
    </div>
  );
}

function DecisionItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-900 py-2 text-xs">
      <span className="font-mono text-slate-400">{label}</span>
      <span
        className={[
          "font-mono font-semibold px-2 py-0.5 rounded text-[11px]",
          value > 0 ? "bg-sky-500/10 text-sky-400 font-bold" : "text-slate-600 bg-slate-900/30",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

export default function FunctionDetailInline({
  fn,
  tab,
}: {
  fn: FunctionReport;
  tab: "overview" | "cyclomatic" | "halstead" | "cfg";
}) {
  const halstead = fn.halstead;
  const breakdown = fn.cyclomaticBreakdown;

  const halsteadRows = useMemo(
    () => [
      ["n1 Distinct Operators", String(halstead.distinctOperators), "Unique operators within AST"],
      ["n2 Distinct Operands", String(halstead.distinctOperands), "Unique operands (variables, constants)"],
      ["N1 Total Operators", String(halstead.totalOperators), "Total operator count"],
      ["N2 Total Operands", String(halstead.totalOperands), "Total operand count"],
      ["Vocabulary (n)", String(halstead.vocabulary), "n1 + n2 (total distinct vocabulary)"],
      ["Length (N)", String(halstead.length), "N1 + N2 (total program length)"],
      ["Volume (V)", halstead.volume.toFixed(1), "N * log2(n) (program size in bits)"],
      ["Difficulty (D)", halstead.difficulty.toFixed(1), "(n1 / 2) * (N2 / n2) (understanding difficulty)"],
      ["Effort (E)", halstead.effort.toFixed(0), "D * V (mental effort required to program)"],
      ["Estimated Bugs (B)", halstead.estimatedBugs.toFixed(3), "V / 3000 (mathematical bug density estimate)"],
      [
        "Time to Program (T)",
        typeof halstead.timeToProgramSeconds === "number" ? `${Math.round(halstead.timeToProgramSeconds)} s` : "-",
        "E / 18 (estimated coding time in seconds)",
      ],
    ],
    [halstead],
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-3 mb-4">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected Function</div>
          <div className="mt-1 font-mono text-xs text-slate-300 truncate" title={`${fn.functionName} (${fn.filePath})`}>
            {fn.functionName} <span className="text-slate-600">·</span>{" "}
            <span className="text-slate-500 truncate">{fn.filePath}</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          {typeof fn.startLine === "number" ? `L${fn.startLine}` : ""}{typeof fn.endLine === "number" ? `–${fn.endLine}` : ""}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <StatCard k="Lines of Code (LOC)" v={fn.loc ? String(fn.loc) : "0"} desc="Physical line count" />
          <StatCard k="Cyclomatic Score (CC)" v={String(fn.cyclomatic)} desc="McCabe branch evaluation" />
          <StatCard
            k="Complexity Level"
            v={fn.complexityStatus === "good" ? "SAFE" : fn.complexityStatus === "medium" ? "WARNING" : "CRITICAL"}
            desc="Safety boundary threshold"
          />
          <StatCard k="Maintainability Index (MI)" v={fn.maintainabilityScore.toFixed(0)} desc="LOC, CC, & Halstead combined" />
          <StatCard k="Halstead Volume (HV)" v={fn.halstead.volume.toFixed(1)} desc="Calculated program size in bits" />
          <StatCard
            k="Refactoring Risk Score"
            v={typeof fn.riskScore === "number" ? `${fn.riskScore.toFixed(0)}%` : "0%"}
            desc="Aggregated risk indicator"
          />
        </div>
      ) : null}

      {tab === "cyclomatic" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">McCabe Complexity</h4>
              <p className="text-[11px] text-slate-500">Calculated by matching AST decision nodes forming execution branches.</p>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <StatCard k="Total Branches" v={String(fn.cyclomatic)} desc="Linearly independent paths" />
              <StatCard
                k="Safety Status"
                v={fn.cyclomatic <= 10 ? "Optimal" : fn.cyclomatic <= 20 ? "Moderate" : "Critical"}
                desc="Threshold index"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950 p-5 shadow-inner">
            <div className="space-y-0.5 border-b border-slate-900 pb-2 mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Decision Node Breakdown</h4>
              <p className="text-[10px] text-slate-500">Branches triggered by keywords or logical evaluations</p>
            </div>
            {breakdown ? (
              <div className="space-y-0">
                <DecisionItem label="'if' conditions" value={breakdown.if} />
                <DecisionItem label="'else if' conditions" value={breakdown.elseIf} />
                <DecisionItem label="'for' loops" value={breakdown.for} />
                <DecisionItem label="'for..in' loops" value={breakdown.forIn} />
                <DecisionItem label="'for..of' loops" value={breakdown.forOf} />
                <DecisionItem label="'while' loops" value={breakdown.while} />
                <DecisionItem label="'do..while' loops" value={breakdown.doWhile} />
                <DecisionItem label="'switch case' statements" value={breakdown.switchCase} />
                <DecisionItem label="'catch' blocks" value={breakdown.catch} />
                <DecisionItem label="ternary conditions (?)" value={breakdown.ternary} />
                <DecisionItem label="logical AND operator (&&)" value={breakdown.and} />
                <DecisionItem label="logical OR operator (||)" value={breakdown.or} />
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">Breakdown details not available for this programming language.</div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "halstead" ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Halstead Metrics</h4>
            <p className="text-[11px] text-slate-500">Calculated based on operator & operand counts collected from the AST.</p>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
            {halsteadRows.map(([k, v, desc]) => (
              <StatCard key={k} k={k} v={v} desc={desc} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "cfg" ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Control Flow Graph (CFG)</h4>
            <p className="text-[11px] text-slate-500">Interactive graph demonstrating program execution transitions.</p>
          </div>
          {fn.cfg?.mermaid ? (
            <div className="space-y-4">
              <MermaidDiagram definition={fn.cfg.mermaid} />
              <details className="rounded-xl border border-slate-900 bg-slate-950 p-4 transition-colors hover:border-slate-800">
                <summary className="cursor-pointer text-xs font-semibold text-slate-400 select-none hover:text-slate-200">
                  Mermaid Graph Spec Definition
                </summary>
                <pre className="mt-3 overflow-x-auto text-[10px] leading-relaxed text-slate-500 font-mono bg-slate-950 p-3 rounded border border-slate-900">
                  {fn.cfg.mermaid}
                </pre>
              </details>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-900 bg-slate-950/40 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-slate-700 mb-2"
              >
                <path d="M18 20a6 6 0 0 0-12 0" />
                <circle cx="12" cy="10" r="4" />
                <path d="M12 2v2" />
              </svg>
              <p className="text-xs font-semibold text-slate-400">CFG Unavailable</p>
              <p className="text-[10px] text-slate-600 max-w-xs mt-1">
                Control Flow Graphs are constructed for parsed functions with explicit logical branch paths.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

