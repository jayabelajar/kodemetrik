import type { CfgEdge, CfgGraph, CfgNode } from "@/types/analysis";
import { makeGraph } from "@/lib/cfg/mermaid";

type PhpNode = any;

type BuildResult = {
  entry: string;
  exits: string[];
};

function locLines(node: any): { startLine?: number; endLine?: number } {
  const startLine = typeof node?.loc?.start?.line === "number" ? node.loc.start.line : undefined;
  const endLine = typeof node?.loc?.end?.line === "number" ? node.loc.end.line : undefined;
  return { startLine, endLine };
}

function isBlock(node: PhpNode): boolean {
  return node?.kind === "block";
}

function getBlockChildren(block: PhpNode): PhpNode[] {
  if (!block) return [];
  if (block.kind === "block" && Array.isArray(block.children)) return block.children;
  return [];
}

function labelFor(node: PhpNode): string {
  const kind = node?.kind;
  if (!kind) return "stmt";
  if (kind === "if") return "if (...)";
  if (kind === "for") return "for (...)";
  if (kind === "foreach") return "foreach (...)";
  if (kind === "while") return "while (...)";
  if (kind === "do") return "do ... while (...)";
  if (kind === "switch") return "switch (...)";
  if (kind === "case") return node?.test ? "case" : "default";
  if (kind === "try") return "try";
  if (kind === "catch") return "catch";
  if (kind === "return") return "return";
  if (kind === "throw") return "throw";
  return kind;
}

export function buildPhpCfg(functionNode: PhpNode): CfgGraph {
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

  const buildBlock = (blockOrArray: PhpNode | PhpNode[]): BuildResult => {
    const stmts = Array.isArray(blockOrArray)
      ? blockOrArray
      : isBlock(blockOrArray)
        ? getBlockChildren(blockOrArray)
        : blockOrArray
          ? [blockOrArray]
          : [];

    if (stmts.length === 0) {
      const noopId = addNode("stmt", "noop");
      return { entry: noopId, exits: [noopId] };
    }

    let acc: BuildResult | null = null;
    for (const s of stmts) {
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

  const buildStmt = (node: PhpNode): BuildResult => {
    const kind = node?.kind;

    if (kind === "block") return buildBlock(node);

    if (kind === "if") {
      const condId = addNode("decision", "if", node);
      const thenRes = buildBlock(node.body);
      edges.push({ from: condId, to: thenRes.entry, label: "T" });

      // elseifs are modeled as nested if nodes in node.alternate / node.alternates depending on parser shape
      const elseBranch = node.alternate ?? null;
      const mergeId = addNode("merge", "merge");
      connectAll(thenRes.exits, mergeId, "next");

      if (elseBranch) {
        const elseRes = buildBlock(elseBranch);
        edges.push({ from: condId, to: elseRes.entry, label: "F" });
        connectAll(elseRes.exits, mergeId, "next");
      } else {
        edges.push({ from: condId, to: mergeId, label: "F" });
      }

      return { entry: condId, exits: [mergeId] };
    }

    if (kind === "for" || kind === "foreach" || kind === "while" || kind === "do") {
      const loopId = addNode("loop", labelFor(node), node);
      const bodyRes = buildBlock(node.body);
      edges.push({ from: loopId, to: bodyRes.entry, label: "T" });
      connectAll(bodyRes.exits, loopId, "back");
      const afterId = addNode("merge", "after loop");
      edges.push({ from: loopId, to: afterId, label: "F" });
      return { entry: loopId, exits: [afterId] };
    }

    if (kind === "switch") {
      const swId = addNode("switch", "switch", node);
      const mergeId = addNode("merge", "after switch");
      const cases: PhpNode[] = Array.isArray(node.body?.children) ? node.body.children : Array.isArray(node.body) ? node.body : [];

      if (cases.length === 0) edges.push({ from: swId, to: mergeId, label: "next" });

      for (const c of cases) {
        if (c?.kind !== "case") continue;
        const caseId = addNode("case", labelFor(c), c);
        edges.push({ from: swId, to: caseId, label: c.test ? "case" : "default" });
        const bodyRes = buildBlock(c.body ?? []);
        edges.push({ from: caseId, to: bodyRes.entry, label: "next" });
        connectAll(bodyRes.exits, mergeId, "next");
      }

      return { entry: swId, exits: [mergeId] };
    }

    if (kind === "try") {
      const tryId = addNode("try", "try", node);
      const tryRes = buildBlock(node.body);
      edges.push({ from: tryId, to: tryRes.entry, label: "next" });

      const mergeId = addNode("merge", "after try");
      connectAll(tryRes.exits, mergeId, "next");

      const catches: PhpNode[] = Array.isArray(node.catches) ? node.catches : [];
      for (const c of catches) {
        if (c?.kind !== "catch") continue;
        const catchId = addNode("catch", "catch", c);
        edges.push({ from: tryId, to: catchId, label: "throw" });
        const catchRes = buildBlock(c.body);
        edges.push({ from: catchId, to: catchRes.entry, label: "next" });
        connectAll(catchRes.exits, mergeId, "next");
      }

      if (node.finally) {
        const finId = addNode("finally", "finally", node.finally);
        edges.push({ from: mergeId, to: finId, label: "next" });
        const finRes = buildBlock(node.finally);
        edges.push({ from: finId, to: finRes.entry, label: "next" });
        const afterFin = addNode("merge", "after finally");
        connectAll(finRes.exits, afterFin, "next");
        return { entry: tryId, exits: [afterFin] };
      }

      return { entry: tryId, exits: [mergeId] };
    }

    if (kind === "return") {
      const retId = addNode("return", "return", node);
      edges.push({ from: retId, to: endId, label: "next" });
      return { entry: retId, exits: [] };
    }

    if (kind === "throw") {
      const thrId = addNode("throw", "throw", node);
      edges.push({ from: thrId, to: endId, label: "next" });
      return { entry: thrId, exits: [] };
    }

    const stmtId = addNode("stmt", labelFor(node), node);
    return { entry: stmtId, exits: [stmtId] };
  };

  const bodyNode = functionNode?.body;
  const built = buildBlock(bodyNode);
  edges.push({ from: startId, to: built.entry, label: "next" });
  connectAll(built.exits, endId, "next");

  return makeGraph(nodes, edges);
}

