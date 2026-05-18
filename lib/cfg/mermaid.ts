import type { CfgEdge, CfgGraph, CfgNode } from "@/types/analysis";

function escapeLabel(s: string): string {
  return s.replaceAll('"', '\\"').replaceAll("\n", " ");
}

export function toMermaidFlowchart(nodes: CfgNode[], edges: CfgEdge[]): string {
  const lines: string[] = [];
  lines.push("flowchart TD");

  for (const n of nodes) {
    const label = escapeLabel(n.label || n.id);
    if (n.kind === "decision" || n.kind === "switch") {
      lines.push(`  ${n.id}{"${label}"}`);
    } else if (n.kind === "start" || n.kind === "end") {
      lines.push(`  ${n.id}(["${label}"])`);
    } else if (n.kind === "return" || n.kind === "throw") {
      lines.push(`  ${n.id}[/"${label}"/]`);
    } else {
      lines.push(`  ${n.id}["${label}"]`);
    }
  }

  for (const e of edges) {
    const lbl = e.label ? `|${e.label}|` : "";
    lines.push(`  ${e.from} -->${lbl} ${e.to}`);
  }

  return lines.join("\n");
}

export function makeGraph(nodes: CfgNode[], edges: CfgEdge[]): CfgGraph {
  return { nodes, edges, mermaid: toMermaidFlowchart(nodes, edges) };
}

