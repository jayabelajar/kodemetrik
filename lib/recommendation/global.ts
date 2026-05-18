import type { FunctionReport } from "@/types/analysis";

export function makeGlobalRecommendations(functions: FunctionReport[]): string[] {
  const recs: string[] = [];
  const high = functions.filter((f) => f.complexityStatus === "high").length;
  const medium = functions.filter((f) => f.complexityStatus === "medium").length;

  if (high > 0) recs.push(`Ada ${high} function dengan kompleksitas tinggi (>20). Prioritaskan refactor.`);
  if (medium > 0) recs.push(`Ada ${medium} function dengan kompleksitas menengah (11–20). Pertimbangkan penyederhanaan.`);

  const lowMaint = functions.filter((f) => f.maintainabilityScore < 60).length;
  if (lowMaint > 0)
    recs.push(`Ada ${lowMaint} function dengan maintainability rendah (<60). Coba kurangi nested conditional dan pecah fungsi.`);

  return recs;
}

