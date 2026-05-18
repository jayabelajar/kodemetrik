import type { HalsteadReport } from "@/types/analysis";

// Lightweight heuristic, not the classic MI formula.
// Output range roughly 0..100 where higher is better.
export function maintainabilityScore(cyclomatic: number, halstead: HalsteadReport): number {
  const volume = halstead.volume || 0;
  const raw = 100 - cyclomatic * 2 - Math.log10(1 + volume) * 12;
  return Math.max(0, Math.min(100, raw));
}

