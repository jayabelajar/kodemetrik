import type { FunctionReport } from "@/types/analysis";

function pill(status: FunctionReport["complexityStatus"]) {
  if (status === "good") return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
  if (status === "medium") return "bg-amber-400/15 text-amber-200 border-amber-400/20";
  return "bg-red-400/15 text-red-200 border-red-400/20";
}

export default function MetricTable({ rows }: { rows: FunctionReport[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-zinc-950">
            <tr className="text-left text-xs font-semibold tracking-wide text-zinc-400">
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Function</th>
              <th className="px-4 py-3">Cyclomatic</th>
              <th className="px-4 py-3">Halstead (Volume)</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-950/30">
            {rows.map((r) => (
              <tr key={`${r.filePath}:${r.functionName}:${r.startLine ?? 0}`} className="border-t border-zinc-800">
                <td className="max-w-[320px] truncate px-4 py-3 font-mono text-xs text-zinc-300">{r.filePath}</td>
                <td className="px-4 py-3 text-zinc-100">{r.functionName}</td>
                <td className="px-4 py-3 font-semibold text-zinc-100">{r.cyclomatic}</td>
                <td className="px-4 py-3 text-zinc-200">{Math.round(r.halstead.volume)}</td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                      pill(r.complexityStatus),
                    ].join(" ")}
                  >
                    {r.complexityStatus.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

