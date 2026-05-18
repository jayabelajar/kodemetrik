export default function ResultCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/50 shadow-md">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-50 font-mono">
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[10px] text-zinc-500 font-mono truncate">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

