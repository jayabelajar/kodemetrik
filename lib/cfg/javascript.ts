import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import type { CfgEdge, CfgGraph, CfgNode } from "@/types/analysis";
import { makeGraph } from "@/lib/cfg/mermaid";

type BuildResult = {
  entry: string;
  exits: string[]; // nodes that should connect to next
};

function locLines(node: any): { startLine?: number; endLine?: number } {
  const startLine = typeof node?.loc?.start?.line === "number" ? node.loc.start.line : undefined;
  const endLine = typeof node?.loc?.end?.line === "number" ? node.loc.end.line : undefined;
  return { startLine, endLine };
}

function shortStmtLabel(stmt: t.Statement): string {
  switch (stmt.type) {
    case "IfStatement":
      return "if (...)";
    case "ForStatement":
      return "for (...)";
    case "ForInStatement":
      return "for (.. in ..)";
    case "ForOfStatement":
      return "for (.. of ..)";
    case "WhileStatement":
      return "while (...)";
    case "DoWhileStatement":
      return "do ... while (...)";
    case "SwitchStatement":
      return "switch (...)";
    case "TryStatement":
      return "try";
    case "ReturnStatement":
      return "return";
    case "ThrowStatement":
      return "throw";
    case "BreakStatement":
      return "break";
    case "ContinueStatement":
      return "continue";
    default:
      return stmt.type.replaceAll("Statement", "");
  }
}

export function buildJavaScriptCfg(functionPath: NodePath<any>): CfgGraph {
  const nodes: CfgNode[] = [];
  const edges: CfgEdge[] = [];

  let seq = 0;
  const nextId = (prefix: string) => `${prefix}_${++seq}`;

  const startId = nextId("start");
  const endId = nextId("end");
  nodes.push({ id: startId, kind: "start", label: "Start" });
  nodes.push({ id: endId, kind: "end", label: "End" });

  const addNode = (kind: CfgNode["kind"], label: string, node?: any): string => {
    const id = nextId(kind);
    const { startLine, endLine } = locLines(node);
    nodes.push({ id, kind, label, startLine, endLine });
    return id;
  };

  const connectAll = (fromIds: string[], toId: string, label?: CfgEdge["label"]) => {
    for (const from of fromIds) edges.push({ from, to: toId, label });
  };

  const buildStmt = (stmt: t.Statement): BuildResult => {
    if (stmt.type === "BlockStatement") return buildBlock(stmt.body);

    if (stmt.type === "IfStatement") {
      const condId = addNode("decision", "if", stmt);
      const cons = buildStmt(stmt.consequent as any);
      const alt = stmt.alternate ? buildStmt(stmt.alternate as any) : null;
      connectAll([condId], cons.entry, "T");
      if (alt) connectAll([condId], alt.entry, "F");

      const mergeId = addNode("merge", "merge");
      connectAll(cons.exits, mergeId, "next");
      if (alt) connectAll(alt.exits, mergeId, "next");
      else edges.push({ from: condId, to: mergeId, label: "F" });

      return { entry: condId, exits: [mergeId] };
    }

    if (
      stmt.type === "ForStatement" ||
      stmt.type === "WhileStatement" ||
      stmt.type === "DoWhileStatement" ||
      stmt.type === "ForInStatement" ||
      stmt.type === "ForOfStatement"
    ) {
      const loopId = addNode("loop", shortStmtLabel(stmt), stmt);
      const body = buildStmt((stmt as any).body as t.Statement);
      connectAll([loopId], body.entry, "T");
      connectAll(body.exits, loopId, "back");
      const afterId = addNode("merge", "after loop");
      edges.push({ from: loopId, to: afterId, label: "F" });
      return { entry: loopId, exits: [afterId] };
    }

    if (stmt.type === "SwitchStatement") {
      const swId = addNode("switch", "switch", stmt);
      const mergeId = addNode("merge", "after switch");

      // Build each case body as a mini-block; approximate fall-through by connecting exits to merge.
      for (const c of stmt.cases) {
        const caseLabel = c.test ? "case" : "default";
        const caseId = addNode("case", caseLabel, c);
        edges.push({ from: swId, to: caseId, label: c.test ? "case" : "default" });
        const body = buildBlock(c.consequent as any);
        edges.push({ from: caseId, to: body.entry, label: "next" });
        connectAll(body.exits, mergeId, "next");
      }

      // If there are no cases, fall through.
      if (stmt.cases.length === 0) edges.push({ from: swId, to: mergeId, label: "next" });

      return { entry: swId, exits: [mergeId] };
    }

    if (stmt.type === "TryStatement") {
      const tryId = addNode("try", "try", stmt);
      const tryBlock = buildBlock(stmt.block.body);

      // Normal flow
      edges.push({ from: tryId, to: tryBlock.entry, label: "next" });

      const mergeId = addNode("merge", "after try");
      connectAll(tryBlock.exits, mergeId, "next");

      // Catch flow (approx)
      if (stmt.handler) {
        const catchId = addNode("catch", "catch", stmt.handler);
        edges.push({ from: tryId, to: catchId, label: "throw" });
        const catchBlock = buildBlock(stmt.handler.body.body);
        edges.push({ from: catchId, to: catchBlock.entry, label: "next" });
        connectAll(catchBlock.exits, mergeId, "next");
      }

      // Finally (approx: always executed before merge)
      if (stmt.finalizer) {
        const finId = addNode("finally", "finally", stmt.finalizer);
        // Route merges into finally then to mergeId
        edges.push({ from: mergeId, to: finId, label: "next" });
        const finBlock = buildBlock(stmt.finalizer.body);
        edges.push({ from: finId, to: finBlock.entry, label: "next" });
        const afterFin = addNode("merge", "after finally");
        connectAll(finBlock.exits, afterFin, "next");
        return { entry: tryId, exits: [afterFin] };
      }

      return { entry: tryId, exits: [mergeId] };
    }

    if (stmt.type === "ReturnStatement") {
      const retId = addNode("return", "return", stmt);
      edges.push({ from: retId, to: endId, label: "next" });
      return { entry: retId, exits: [] };
    }

    if (stmt.type === "ThrowStatement") {
      const thrId = addNode("throw", "throw", stmt);
      edges.push({ from: thrId, to: endId, label: "next" });
      return { entry: thrId, exits: [] };
    }

    // Generic statement
    const stmtId = addNode("stmt", shortStmtLabel(stmt), stmt);
    return { entry: stmtId, exits: [stmtId] };
  };

  const buildBlock = (statements: t.Statement[]): BuildResult => {
    if (!statements || statements.length === 0) {
      const noopId = addNode("stmt", "noop");
      return { entry: noopId, exits: [noopId] };
    }

    let acc: BuildResult | null = null;
    for (const s of statements) {
      const built = buildStmt(s);
      if (!acc) {
        acc = built;
      } else {
        connectAll(acc.exits, built.entry, "next");
        acc = { entry: acc.entry, exits: built.exits };
      }
    }
    return acc!;
  };

  const bodyStatements: t.Statement[] = functionPath.node.body?.body ?? [];
  const built = buildBlock(bodyStatements);
  edges.push({ from: startId, to: built.entry, label: "next" });
  connectAll(built.exits, endId, "next");

  return makeGraph(nodes, edges);
}

