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
};

export type FunctionReport = {
  filePath: string;
  functionName: string;
  startLine?: number;
  cyclomatic: number;
  complexityStatus: ComplexityStatus;
  halstead: HalsteadReport;
  maintainabilityScore: number;
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

