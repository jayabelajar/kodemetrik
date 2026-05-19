import { parse } from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import type { FunctionReport } from "@/types/analysis";
import { baseComplexity, addDecision } from "@/lib/metrics/cyclomatic";
import { halsteadFromCounts, type HalsteadCounts } from "@/lib/metrics/halstead";
import { maintainabilityScore } from "@/lib/metrics/maintainability";
import { complexityStatus, recommendForComplexity } from "@/lib/recommendation/perFunction";
import { buildJavaScriptCfg } from "@/lib/cfg/javascript";

type CyclomaticBreakdown = NonNullable<FunctionReport["cyclomaticBreakdown"]>;

function getStartLine(node: any): number | undefined {
  return typeof node?.loc?.start?.line === "number" ? node.loc.start.line : undefined;
}
function getEndLine(node: any): number | undefined {
  return typeof node?.loc?.end?.line === "number" ? node.loc.end.line : undefined;
}

function functionName(path: NodePath<t.Function | t.ArrowFunctionExpression>): string {
  const n = path.node as any;
  if (n?.id?.type === "Identifier") return n.id.name;
  const parent = path.parentPath;
  if (!parent) return "<anonymous>";
  if (parent.isVariableDeclarator() && parent.node.id.type === "Identifier") return parent.node.id.name;
  if (parent.isObjectProperty() && parent.node.key.type === "Identifier") return parent.node.key.name;
  if (parent.isClassMethod() && parent.node.key.type === "Identifier") return parent.node.key.name;
  if (parent.isObjectMethod() && parent.node.key.type === "Identifier") return parent.node.key.name;
  return "<anonymous>";
}

function collectHalsteadForFunction(path: NodePath<any>): HalsteadCounts {
  const operators: string[] = [];
  const operands: string[] = [];
  const rootNode = path.node;

  path.traverse({
    enter(p) {
      // Exclude nested functions from *this* function's metrics.
      if (p.isFunction() && p.node !== rootNode) p.skip();
    },
    BinaryExpression(p) {
      operators.push(p.node.operator);
    },
    LogicalExpression(p) {
      operators.push(p.node.operator);
    },
    AssignmentExpression(p) {
      operators.push(p.node.operator);
    },
    UnaryExpression(p) {
      operators.push(p.node.operator);
    },
    UpdateExpression(p) {
      operators.push(p.node.operator);
    },
    ConditionalExpression() {
      operators.push("?:");
    },
    CallExpression() {
      operators.push("call");
    },
    NewExpression() {
      operators.push("new");
    },
    AwaitExpression() {
      operators.push("await");
    },
    YieldExpression() {
      operators.push("yield");
    },
    MemberExpression() {
      operators.push(".");
    },
    ThisExpression() {
      operands.push("this");
    },
    Super() {
      operands.push("super");
    },
    Identifier(p) {
      const parent = p.parentPath;
      // Skip non-semantic identifiers that should not count as operands.
      // - declaration/binding names (fn name, params, var decl)
      // - non-computed property keys (obj.{key})
      // - import/export specifiers
      // - labels (label:)
      // - type-only nodes (TS)
      if (parent?.isFunctionDeclaration() && p.key === "id") return;
      if (parent?.isFunctionExpression() && p.key === "id") return;
      if (parent?.isClassDeclaration() && p.key === "id") return;
      if (parent?.isClassExpression() && p.key === "id") return;
      if (parent?.isVariableDeclarator() && p.key === "id") return;
      if (parent?.isRestElement() && p.key === "argument") return;
      if (parent?.isObjectProperty() && p.key === "key" && !(parent.node as any).computed) return;
      if (parent?.isObjectMethod() && p.key === "key" && !(parent.node as any).computed) return;
      if (parent?.isClassMethod() && p.key === "key" && !(parent.node as any).computed) return;
      if (parent?.isClassProperty?.() && p.key === "key" && !(parent.node as any).computed) return;
      if (parent?.isMemberExpression() && p.key === "property" && !(parent.node as any).computed) return;
      if (
        parent?.isImportSpecifier?.() ||
        parent?.isImportDefaultSpecifier?.() ||
        parent?.isImportNamespaceSpecifier?.() ||
        parent?.isExportSpecifier?.()
      ) {
        return;
      }
      if (parent?.isLabeledStatement() && p.key === "label") return;
      if (parent?.isTSInterfaceDeclaration?.()) return;
      if (parent?.isTSTypeAliasDeclaration?.()) return;
      if (parent?.isTSTypeParameter?.()) return;
      if (parent?.isTSTypeParameterDeclaration?.()) return;
      if (parent?.isTSTypeParameterInstantiation?.()) return;

      operands.push(p.node.name);
    },
    StringLiteral(p) {
      operands.push(JSON.stringify(p.node.value));
    },
    NumericLiteral(p) {
      operands.push(String(p.node.value));
    },
    BooleanLiteral(p) {
      operands.push(String(p.node.value));
    },
    NullLiteral() {
      operands.push("null");
    },
  });

  return { operators, operands };
}

function cyclomaticForFunction(path: NodePath<any>): { score: number; breakdown: CyclomaticBreakdown } {
  let complexity = baseComplexity();
  const breakdown: CyclomaticBreakdown = {
    if: 0,
    elseIf: 0,
    for: 0,
    forIn: 0,
    forOf: 0,
    while: 0,
    doWhile: 0,
    switchCase: 0,
    catch: 0,
    ternary: 0,
    and: 0,
    or: 0,
  };
  const rootNode = path.node;

  path.traverse({
    enter(p) {
      // Exclude nested functions from *this* function's metrics.
      if (p.isFunction() && p.node !== rootNode) p.skip();
    },
    IfStatement(p: NodePath<t.IfStatement>) {
      complexity = addDecision(complexity);
      breakdown.if += 1;
      if (p.node.alternate && p.node.alternate.type === "IfStatement") breakdown.elseIf += 1;
    },
    ForStatement() {
      complexity = addDecision(complexity);
      breakdown.for += 1;
    },
    ForInStatement() {
      complexity = addDecision(complexity);
      breakdown.forIn += 1;
    },
    ForOfStatement() {
      complexity = addDecision(complexity);
      breakdown.forOf += 1;
    },
    WhileStatement() {
      complexity = addDecision(complexity);
      breakdown.while += 1;
    },
    DoWhileStatement() {
      complexity = addDecision(complexity);
      breakdown.doWhile += 1;
    },
    CatchClause() {
      complexity = addDecision(complexity);
      breakdown.catch += 1;
    },
    ConditionalExpression() {
      complexity = addDecision(complexity);
      breakdown.ternary += 1;
    },
    LogicalExpression(p) {
      if (p.node.operator === "&&") {
        complexity = addDecision(complexity);
        breakdown.and += 1;
      } else if (p.node.operator === "||") {
        complexity = addDecision(complexity);
        breakdown.or += 1;
      }
    },
    SwitchCase(p) {
      if (p.node.test) {
        complexity = addDecision(complexity);
        breakdown.switchCase += 1;
      }
    },
  });

  return { score: complexity, breakdown };
}

function toReport(filePath: string, path: NodePath<any>): FunctionReport {
  const cyclo = cyclomaticForFunction(path);
  const cyclomatic = cyclo.score;
  const halstead = halsteadFromCounts(collectHalsteadForFunction(path));
  const status = complexityStatus(cyclomatic);
  const mi = maintainabilityScore(cyclomatic, halstead);
  const startLine = getStartLine(path.node);
  const endLine = getEndLine(path.node);
  const loc =
    typeof startLine === "number" && typeof endLine === "number" && endLine >= startLine
      ? endLine - startLine + 1
      : undefined;
  const riskScore = Math.min(
    100,
    Math.max(0, cyclomatic * 3 + Math.log10(1 + halstead.effort) * 10 + (loc ?? 0) * 0.2),
  );
  const cfg = buildJavaScriptCfg(path);
  return {
    filePath,
    functionName: functionName(path as any),
    startLine,
    endLine,
    loc,
    cyclomatic,
    complexityStatus: status,
    cyclomaticBreakdown: cyclo.breakdown,
    halstead,
    maintainabilityScore: mi,
    riskScore,
    cfg,
    recommendations: recommendForComplexity(status),
  };
}

export async function analyzeJavaScriptFile(filePath: string, code: string): Promise<FunctionReport[]> {
  const ast = parse(code, {
    sourceType: "unambiguous",
    plugins: [
      "jsx",
      "typescript",
      "classProperties",
      "classPrivateProperties",
      "classPrivateMethods",
      "decorators-legacy",
      "dynamicImport",
      "optionalChaining",
      "nullishCoalescingOperator",
      "objectRestSpread",
      "topLevelAwait",
    ],
    errorRecovery: true,
    allowReturnOutsideFunction: true,
  });

  const results: FunctionReport[] = [];

  traverse(ast, {
    FunctionDeclaration(path) {
      results.push(toReport(filePath, path));
    },
    FunctionExpression(path) {
      results.push(toReport(filePath, path));
    },
    ArrowFunctionExpression(path) {
      results.push(toReport(filePath, path));
    },
    ClassMethod(path) {
      results.push(toReport(filePath, path));
    },
    ObjectMethod(path) {
      results.push(toReport(filePath, path));
    },
  });

  return results;
}
