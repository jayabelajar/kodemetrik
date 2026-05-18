import type { HalsteadReport } from "@/types/analysis";

export type HalsteadCounts = {
  operators: string[];
  operands: string[];
};

function safeLog2(n: number) {
  if (n <= 0) return 0;
  return Math.log(n) / Math.log(2);
}

export function halsteadFromCounts(counts: HalsteadCounts): HalsteadReport {
  const totalOperators = counts.operators.length;
  const totalOperands = counts.operands.length;
  const distinctOperators = new Set(counts.operators).size;
  const distinctOperands = new Set(counts.operands).size;

  const vocabulary = distinctOperators + distinctOperands;
  const length = totalOperators + totalOperands;
  const volume = vocabulary === 0 ? 0 : length * safeLog2(vocabulary);
  const difficulty =
    distinctOperands === 0 ? 0 : (distinctOperators / 2) * (totalOperands / Math.max(1, distinctOperands));
  const effort = difficulty * volume;
  const estimatedBugs = volume / 3000;

  return {
    distinctOperators,
    distinctOperands,
    totalOperators,
    totalOperands,
    vocabulary,
    length,
    volume,
    difficulty,
    effort,
    estimatedBugs,
  };
}

