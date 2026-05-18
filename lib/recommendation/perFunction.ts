import type { ComplexityStatus } from "@/types/analysis";

export function complexityStatus(score: number): ComplexityStatus {
  if (score <= 10) return "good";
  if (score <= 20) return "medium";
  return "high";
}

export function recommendForComplexity(status: ComplexityStatus): string[] {
  if (status === "good") return [];
  if (status === "medium")
    return ["Pertimbangkan memecah conditional/loop menjadi helper function kecil."];
  return [
    "Function terlalu kompleks. Pecah menjadi beberapa function yang lebih kecil.",
    "Kurangi nested conditional; gunakan early return bila memungkinkan.",
  ];
}

