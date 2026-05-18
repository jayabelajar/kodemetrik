import { parse } from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import type { FunctionReport } from "@/types/analysis";
import { baseComplexity, addDecision } from "@/lib/metrics/cyclomatic";
import { halsteadFromCounts, type HalsteadCounts } from "@/lib/metrics/halstead";
import { maintainabilityScore } from "@/lib/metrics/maintainability";
import { complexityStatus, recommendForComplexity } from "@/lib/recommendation/perFunction";

function getStartLine(node: any): number | undefined {
  return typeof node?.loc?.start?.line === "number" ? node.loc.start.line : undefined;
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

  path.traverse({
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
    MemberExpression() {
      operators.push(".");
    },
    Identifier(p) {
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

function cyclomaticForFunction(path: NodePath<any>): number {
  let complexity = baseComplexity();

  path.traverse({
    IfStatement() {
      complexity = addDecision(complexity);
    },
    ForStatement() {
      complexity = addDecision(complexity);
    },
    ForInStatement() {
      complexity = addDecision(complexity);
    },
    ForOfStatement() {
      complexity = addDecision(complexity);
    },
    WhileStatement() {
      complexity = addDecision(complexity);
    },
    DoWhileStatement() {
      complexity = addDecision(complexity);
    },
    CatchClause() {
      complexity = addDecision(complexity);
    },
    ConditionalExpression() {
      complexity = addDecision(complexity);
    },
    LogicalExpression(p) {
      if (p.node.operator === "&&" || p.node.operator === "||") complexity = addDecision(complexity);
    },
    SwitchCase(p) {
      if (p.node.test) complexity = addDecision(complexity);
    },
  });

  return complexity;
}

function toReport(filePath: string, path: NodePath<any>): FunctionReport {
  const cyclomatic = cyclomaticForFunction(path);
  const halstead = halsteadFromCounts(collectHalsteadForFunction(path));
  const status = complexityStatus(cyclomatic);
  const mi = maintainabilityScore(cyclomatic, halstead);
  return {
    filePath,
    functionName: functionName(path as any),
    startLine: getStartLine(path.node),
    cyclomatic,
    complexityStatus: status,
    halstead,
    maintainabilityScore: mi,
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

