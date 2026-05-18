import type { LanguageId } from "@/types/analysis";

export function detectLanguageFromPath(path: string): LanguageId | null {
  const lower = path.toLowerCase();
  if (lower.endsWith(".php")) return "php";
  if (
    lower.endsWith(".js") ||
    lower.endsWith(".mjs") ||
    lower.endsWith(".cjs") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".tsx")
  )
    return "javascript";
  return null;
}

