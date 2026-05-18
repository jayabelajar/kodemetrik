import type { AnalyzeInput, AnalysisReport, FunctionReport } from "@/types/analysis";
import { analyzeJavaScriptFile } from "@/lib/parser/javascript";
import { analyzePhpFile } from "@/lib/parser/php";
import { makeGlobalRecommendations } from "@/lib/recommendation/global";

export async function analyzeInputs(inputs: AnalyzeInput[]): Promise<AnalysisReport> {
  const functions: FunctionReport[] = [];

  for (const input of inputs) {
    if (!input.content.trim()) continue;
    const perFile =
      input.language === "php"
        ? await analyzePhpFile(input.path, input.content)
        : await analyzeJavaScriptFile(input.path, input.content);
    functions.push(...perFile);
  }

  const totalFiles = new Set(inputs.map((i) => i.path)).size;
  const totalFunctions = functions.length;
  const averageComplexity =
    totalFunctions === 0 ? 0 : functions.reduce((s, f) => s + f.cyclomatic, 0) / totalFunctions;
  const averageMaintainability =
    totalFunctions === 0 ? 0 : functions.reduce((s, f) => s + f.maintainabilityScore, 0) / totalFunctions;

  return {
    summary: {
      totalFiles,
      totalFunctions,
      averageComplexity,
      averageMaintainability,
    },
    functions: functions.sort((a, b) => b.cyclomatic - a.cyclomatic),
    recommendations: makeGlobalRecommendations(functions),
  };
}

