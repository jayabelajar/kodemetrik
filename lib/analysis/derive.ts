import type { ComplexityStatus, FunctionReport } from "@/types/analysis";

export type FileRow = {
  filePath: string;
  totalFunctions: number;
  averageComplexity: number;
  maxComplexity: number;
  averageMaintainability: number;
  estimatedBugs: number;
  status: ComplexityStatus;
};

function statusForFile(functions: FunctionReport[]): ComplexityStatus {
  const hasHigh = functions.some((f) => f.complexityStatus === "high");
  if (hasHigh) return "high";
  const hasMedium = functions.some((f) => f.complexityStatus === "medium");
  if (hasMedium) return "medium";
  return "good";
}

export function fileRowsFromFunctions(functions: FunctionReport[]): FileRow[] {
  const map = new Map<string, FunctionReport[]>();
  for (const fn of functions) {
    const list = map.get(fn.filePath) ?? [];
    list.push(fn);
    map.set(fn.filePath, list);
  }

  const rows: FileRow[] = [];
  for (const [filePath, list] of map.entries()) {
    const totalFunctions = list.length;
    const averageComplexity =
      list.reduce((sum, f) => sum + f.cyclomatic, 0) / Math.max(1, totalFunctions);
    const maxComplexity = list.reduce((m, f) => Math.max(m, f.cyclomatic), 0);
    const averageMaintainability =
      list.reduce((sum, f) => sum + f.maintainabilityScore, 0) / Math.max(1, totalFunctions);
    const estimatedBugs = list.reduce((sum, f) => sum + (f.halstead.estimatedBugs || 0), 0);

    rows.push({
      filePath,
      totalFunctions,
      averageComplexity,
      maxComplexity,
      averageMaintainability,
      estimatedBugs,
      status: statusForFile(list),
    });
  }

  rows.sort((a, b) => b.maxComplexity - a.maxComplexity);
  return rows;
}

