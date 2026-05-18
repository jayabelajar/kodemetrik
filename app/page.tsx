import Link from "next/link";

const Feature = ({ title, desc }: { title: string; desc: string }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
    <div className="text-sm font-semibold text-zinc-100">{title}</div>
    <div className="mt-2 text-sm text-zinc-300">{desc}</div>
  </div>
);

export default function LandingPage() {
  return (
    <main className="space-y-10">
      <header className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-950 p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-zinc-400">
              CODE METRIC ANALYZER
            </div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">
              Cyclomatic Complexity &amp; Halstead Metrics, langsung di browser
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-300">
              Paste code, upload file, atau upload folder kecil untuk mendapatkan ringkasan kualitas kode,
              detail per function, dan rekomendasi refactor sederhana.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/analyzer"
              className="rounded-lg bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white"
            >
              Open Analyzer
            </Link>
            <a
              href="#metrics"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
            >
              Learn Metrics
            </a>
          </div>
        </div>
      </header>

      <section id="metrics" className="grid gap-4 md:grid-cols-2">
        <Feature
          title="Cyclomatic Complexity (McCabe)"
          desc="Mengukur jumlah jalur eksekusi. Semakin tinggi, semakin sulit diuji dan dirawat."
        />
        <Feature
          title="Halstead Metrics"
          desc="Mengukur effort berdasarkan operator/operand; memberi insight volume, difficulty, effort, dan estimasi bug."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature title="Paste Code" desc="Analisis cepat via editor." />
        <Feature title="Upload File" desc="Dukung .js dan .php (MVP)." />
        <Feature title="Upload Folder" desc="Batas MVP: max 100 file, max 5MB total." />
      </section>

      <footer className="text-xs text-zinc-500">
        MVP focus: JavaScript &amp; PHP. Deploy target: Vercel (client-side analysis).
      </footer>
    </main>
  );
}

