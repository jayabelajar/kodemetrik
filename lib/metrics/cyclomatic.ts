export function baseComplexity(): number {
  return 1;
}

export function addDecision(complexity: number, n = 1): number {
  return complexity + n;
}

