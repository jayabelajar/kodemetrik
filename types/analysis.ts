export type LanguageId = "javascript" | "php";

export type AnalyzeInput = {
  path: string;
  language: LanguageId;
  content: string;
};

export type ComplexityStatus = "good" | "medium" | "high";

export type HalsteadReport = {
  distinctOperators: number;
  distinctOperands: number;
  totalOperators: number;
  totalOperands: number;
  vocabulary: number;
  length: number;
  volume: number;
  difficulty: number;
  effort: number;
  estimatedBugs: number;
  timeToProgramSeconds?: number;
};

export type CyclomaticBreakdown = {
  if: number;
  elseIf: number;
  for: number;
  forIn: number;
  forOf: number;
  while: number;
  doWhile: number;
  switchCase: number;
  catch: number;
  ternary: number;
  and: number; // &&
  or: number; // ||
};

export type CfgNode = {
  id: string;
  kind:
    | "start"
    | "end"
    | "stmt"
    | "decision"
    | "merge"
    | "loop"
    | "switch"
    | "case"
    | "try"
    | "catch"
    | "finally"
    | "return"
    | "throw";
  label: string;
  startLine?: number;
  endLine?: number;
};

export type CfgEdge = {
  from: string;
  to: string;
  label?: "T" | "F" | "next" | "case" | "default" | "back" | "throw";
};

export type CfgGraph = {
  nodes: CfgNode[];
  edges: CfgEdge[];
  mermaid: string;
  dot?: string;
};

export type FunctionReport = {
  filePath: string;
  functionName: string;
  startLine?: number;
  endLine?: number;
  loc?: number;
  cyclomatic: number;
  complexityStatus: ComplexityStatus;
  cyclomaticBreakdown?: CyclomaticBreakdown;
  halstead: HalsteadReport;
  maintainabilityScore: number;
  riskScore?: number;
  cfg?: CfgGraph;
  recommendations: string[];
};

export type SummaryReport = {
  totalFiles: number;
  totalFunctions: number;
  averageComplexity: number;
  averageMaintainability: number;
};

export type AnalysisReport = {
  summary: SummaryReport;
  functions: FunctionReport[];
  recommendations: string[];
};
