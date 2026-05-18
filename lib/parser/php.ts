import type { FunctionReport } from "@/types/analysis";
import { Engine } from "php-parser";
import { baseComplexity, addDecision } from "@/lib/metrics/cyclomatic";
import { halsteadFromCounts, type HalsteadCounts } from "@/lib/metrics/halstead";
import { maintainabilityScore } from "@/lib/metrics/maintainability";
import { complexityStatus, recommendForComplexity } from "@/lib/recommendation/perFunction";

type PhpNode = any;

function getStartLine(node: any): number | undefined {
  return typeof node?.loc?.start?.line === "number" ? node.loc.start.line : undefined;
}

function walk(node: PhpNode, visit: (n: PhpNode) => void) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const v of Object.values(node)) {
    if (Array.isArray(v)) {
      for (const item of v) walk(item, visit);
    } else if (v && typeof v === "object") {
      walk(v, visit);
    }
  }
}

function cyclomaticForFunction(body: PhpNode): number {
  let complexity = baseComplexity();
  walk(body, (n) => {
    const kind = n?.kind;
    if (!kind) return;
    if (
      kind === "if" ||
      kind === "for" ||
      kind === "foreach" ||
      kind === "while" ||
      kind === "do" ||
      kind === "catch" ||
      kind === "ternary"
    ) {
      complexity = addDecision(complexity);
    }
    if (kind === "case") complexity = addDecision(complexity);
    if (kind === "bin" && (n.type === "&&" || n.type === "||")) complexity = addDecision(complexity);
  });
  return complexity;
}

function halsteadForFunction(body: PhpNode): HalsteadCounts {
  const operators: string[] = [];
  const operands: string[] = [];
  walk(body, (n) => {
    const kind = n?.kind;
    if (!kind) return;
    if (kind === "bin") operators.push(String(n.type ?? "bin"));
    if (kind === "assign") operators.push("=");
    if (kind === "unary") operators.push(String(n.type ?? "unary"));
    if (kind === "call") operators.push("call");
    if (kind === "propertylookup" || kind === "staticlookup") operators.push("->");
    if (kind === "variable") operands.push(String(n.name ?? "$var"));
    if (kind === "identifier") operands.push(String(n.name ?? "id"));
    if (kind === "number") operands.push(String(n.value));
    if (kind === "string") operands.push(JSON.stringify(n.value));
    if (kind === "boolean") operands.push(String(n.value));
    if (kind === "nullkeyword") operands.push("null");
  });
  return { operators, operands };
}

function nameFromNode(n: any): string {
  if (typeof n?.name === "string") return n.name;
  if (typeof n?.name?.name === "string") return n.name.name;
  return "<anonymous>";
}

export async function analyzePhpFile(filePath: string, code: string): Promise<FunctionReport[]> {
  const parser = new Engine({
    parser: { extractDoc: false, php7: true },
    ast: { withPositions: true },
    lexer: { all_tokens: false },
  });

  let ast: any;
  try {
    ast = parser.parseCode(code, filePath);
  } catch {
    return [];
  }

  const results: FunctionReport[] = [];

  walk(ast, (n) => {
    if (!n || typeof n !== "object") return;
    if (n.kind === "function" || n.kind === "method") {
      const cyclomatic = cyclomaticForFunction(n.body);
      const halstead = halsteadFromCounts(halsteadForFunction(n.body));
      const status = complexityStatus(cyclomatic);
      const mi = maintainabilityScore(cyclomatic, halstead);
      results.push({
        filePath,
        functionName: nameFromNode(n),
        startLine: getStartLine(n),
        cyclomatic,
        complexityStatus: status,
        halstead,
        maintainabilityScore: mi,
        recommendations: recommendForComplexity(status),
      });
    }
  });

  return results;
}
