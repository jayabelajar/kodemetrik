import Link from "next/link";
import LatestResultsLink from "@/components/LatestResultsLink";

function Section({
  id,
  title,
  desc,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-slate-100">{title}</h2>
        {desc ? <p className="text-sm text-slate-400">{desc}</p> : null}
      </div>
      {children}
    </section>
  );
}

function MiniCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 shadow-xl">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{title}</div>
      <div className="mt-2 text-sm text-slate-400 leading-relaxed">{children}</div>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-900/70 px-1.5 py-0.5 font-mono text-[12px] text-slate-200 border border-slate-800">
      {children}
    </code>
  );
}

export default function DocsPage() {
  return (
    <main className="space-y-10 animate-fade-in">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Docs</h1>
            <p className="text-sm text-slate-400">
              Panduan pemakaian KodeMetrik + penjelasan rumus dan cara penentuan metrik.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/analyzer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Open Analyzer
            </Link>
            <LatestResultsLink
              className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:text-white"
            >
              Open Results
            </LatestResultsLink>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900/50 to-slate-950 p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { href: "#quickstart", label: "Quickstart" },
              { href: "#interpretation", label: "Interpretasi" },
              { href: "#cyclomatic", label: "Cyclomatic (CC)" },
              { href: "#halstead", label: "Halstead" },
              { href: "#mi", label: "Maintainability (MI)" },
              { href: "#references", label: "Referensi" },
            ].map((x) => (
              <a
                key={x.href}
                href={x.href}
                className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-900/30 transition-colors"
              >
                {x.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <Section
        id="quickstart"
        title="Quickstart"
        desc="Langkah paling cepat untuk dapat hasil analisis + export PDF/Excel."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard title="1) Input code">
            Masuk ke <Link href="/analyzer" className="text-blue-400 hover:text-blue-300">Analyzer</Link>, lalu pilih mode{" "}
            <InlineCode>Paste</InlineCode>, <InlineCode>File</InlineCode>, atau <InlineCode>Folder</InlineCode>.
          </MiniCard>
          <MiniCard title="2) Run analysis">
            Klik <InlineCode>Run Diagnosis</InlineCode>. Setelah selesai, kamu otomatis diarahkan ke halaman{" "}
            <InlineCode>/results</InlineCode>.
          </MiniCard>
          <MiniCard title="3) Export">
            Di halaman Results, gunakan <InlineCode>Print PDF</InlineCode> untuk tabel data saja, atau{" "}
            <InlineCode>Export Excel</InlineCode> untuk file <InlineCode>.xlsx</InlineCode> (sheet Functions & Files).
          </MiniCard>
        </div>
      </Section>

      <Section
        id="interpretation"
        title="Interpretasi Hasil"
        desc="Apa arti angka-angka utama dan cara membacanya secara praktis."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <MiniCard title="Cyclomatic Complexity (CC)">
            CC mengukur jumlah jalur eksekusi independen. Semakin tinggi, makin sulit dites & dipelihara. Di UI, status
            dibagi menjadi <InlineCode>SAFE</InlineCode>, <InlineCode>WARNING</InlineCode>, dan{" "}
            <InlineCode>CRITICAL</InlineCode>.
          </MiniCard>
          <MiniCard title="Maintainability Index (MI)">
            MI adalah skor ringkas “kemudahan maintain”. Skor lebih tinggi biasanya lebih baik. Di KodeMetrik, MI adalah
            skor <em>heuristic</em> berbasis Cyclomatic Complexity dan Halstead Volume (bukan formula MI klasik yang umum
            di beberapa tool lain).
          </MiniCard>
          <MiniCard title="Halstead (HV, Effort, Bugs)">
            Halstead dihitung dari token operator/operand. Umumnya: Volume (HV) naik saat vocabulary/length naik; Effort
            naik saat difficulty & volume naik; Estimated Bugs adalah estimasi statistik.
          </MiniCard>
          <MiniCard title="Files vs Functions">
            Tab/Sheet <InlineCode>Functions</InlineCode> menampilkan metrik per fungsi. Tab/Sheet{" "}
            <InlineCode>Files</InlineCode> merangkum agregasi per file (avg/max, jumlah fungsi, dll).
          </MiniCard>
        </div>
      </Section>

      <Section id="cyclomatic" title="Cyclomatic Complexity (McCabe)">
        <div className="space-y-4">
          <MiniCard title="Definisi">
            Cyclomatic Complexity (CC) secara klasik: <InlineCode>CC = E − N + 2P</InlineCode> (E = edges, N = nodes, P
            = jumlah komponen terhubung). Dalam static analysis praktis, CC biasanya dihitung dari “decision points”.
            <div className="mt-2 text-xs text-slate-500">
              KodeMetrik memakai pendekatan <InlineCode>CC = 1 + jumlah decision points</InlineCode>, dan nested
              function/closure tidak dihitung ke parent function.
            </div>
          </MiniCard>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden shadow-xl">
            <div className="border-b border-slate-900 bg-slate-900/30 px-5 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Decision Points (umum)
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Intinya: <InlineCode>CC = 1 + jumlah keputusan</InlineCode> (pendekatan umum).
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead className="border-b border-slate-900 bg-slate-900/20">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Konstruksi</th>
                    <th className="px-5 py-3">Kontribusi CC</th>
                    <th className="px-5 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {[
                    { k: "if", c: "+1", n: "Setiap kondisi if menambah 1" },
                    { k: "else if", c: "+1", n: "Termasuk hitungan if; ditampilkan di breakdown untuk informasi" },
                    { k: "for / while / do-while", c: "+1", n: "Loop menambah 1" },
                    { k: "switch: case", c: "+1 / case", n: "Setiap case yang memiliki test menambah 1 (default tidak)" },
                    { k: "catch", c: "+1", n: "Penanganan exception menambah jalur" },
                    { k: "ternary (?:)", c: "+1", n: "Operator kondisional menambah 1" },
                    { k: "&& / ||", c: "+1 / operator", n: "Short-circuit logic menambah decision points" },
                  ].map((r) => (
                    <tr key={r.k} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-200">{r.k}</td>
                      <td className="px-5 py-3 font-mono text-slate-200">{r.c}</td>
                      <td className="px-5 py-3 text-slate-400">{r.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      <Section id="halstead" title="Halstead Metrics (Operator & Operand)">
        <div className="grid gap-4 md:grid-cols-2">
          <MiniCard title="Token dasar (n1, n2, N1, N2)">
            - <InlineCode>n1</InlineCode>: distinct operators<br />
            - <InlineCode>n2</InlineCode>: distinct operands<br />
            - <InlineCode>N1</InlineCode>: total operators<br />
            - <InlineCode>N2</InlineCode>: total operands
          </MiniCard>
          <MiniCard title="Rumus inti">
            - Vocabulary: <InlineCode>n = n1 + n2</InlineCode><br />
            - Length: <InlineCode>N = N1 + N2</InlineCode><br />
            - Volume: <InlineCode>V = N × log2(n)</InlineCode><br />
            - Difficulty: <InlineCode>D = (n1/2) × (N2/n2)</InlineCode><br />
            - Effort: <InlineCode>E = D × V</InlineCode><br />
            - Est. Bugs: <InlineCode>B = V / 3000</InlineCode><br />
            - Time to program (sec): <InlineCode>T = E / 18</InlineCode>
          </MiniCard>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 shadow-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Catatan implementasi</div>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Nilai Halstead berasal dari hasil parsing AST. Detail bisa berbeda antar tool karena definisi operator/operand
            bisa berbeda. Di KodeMetrik:
            <br />
            - JavaScript: operator termasuk <InlineCode>call</InlineCode>, <InlineCode>new</InlineCode>,{" "}
            <InlineCode>await</InlineCode>, <InlineCode>yield</InlineCode>, dan akses properti <InlineCode>.</InlineCode>.
            Operand berasal dari identifier & literal, dengan pengecualian seperti nama deklarasi dan key properti non-computed.
            <br />
            - PHP: operator termasuk <InlineCode>call</InlineCode>, <InlineCode>new</InlineCode>, dan lookup{" "}
            <InlineCode>{"->"}</InlineCode>. Operand berasal dari variabel, identifier, dan literal.
          </p>
        </div>
      </Section>

      <Section id="mi" title="Maintainability Index (MI)">
        <div className="grid gap-4 md:grid-cols-2">
          <MiniCard title="Konsep">
            MI menggabungkan ukuran, kompleksitas, dan volume informasi menjadi skor ringkas. Skor lebih tinggi biasanya
            lebih baik (lebih mudah dirawat).
          </MiniCard>
          <MiniCard title="Formula di KodeMetrik (heuristic)">
            Skor 0..100 (clamp) untuk perbandingan relatif antar fungsi:
            <br />
            <InlineCode>MI = clamp(100 − 2×CC − 12×log10(1 + V), 0, 100)</InlineCode>
            <br />
            dengan <InlineCode>V</InlineCode> = Halstead Volume.
          </MiniCard>
        </div>
      </Section>

      <Section id="references" title="Referensi & Metode">
        <div className="grid gap-4 md:grid-cols-2">
          <MiniCard title="Sumber konsep (akademik)">
            - T. J. McCabe, <em>A Complexity Measure</em>, IEEE Transactions on Software Engineering, 1976.
            <br />
            <span className="text-xs text-slate-500">
              (Cyclomatic Complexity; definisi graph <InlineCode>CC = E − N + 2P</InlineCode>).
            </span>
            <br />
            <br />
            - M. H. Halstead, <em>Elements of Software Science</em>, 1977.
            <br />
            <span className="text-xs text-slate-500">
              (Halstead Software Science; vocabulary/length/volume/difficulty/effort).
            </span>
          </MiniCard>
          <MiniCard title="Implementasi di KodeMetrik">
            - CC dihitung dengan pendekatan <InlineCode>decision points</InlineCode> berbasis AST (praktis untuk static analysis).
            <br />
            - Halstead dihitung dari counting operator/operand berbasis AST; hasil bisa berbeda antar tool karena definisi token bisa berbeda.
            <br />
            - MI di KodeMetrik adalah <em>heuristic score</em> (bukan MI klasik) untuk perbandingan relatif.
            <br />
            </MiniCard>
        </div>
      </Section>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-100">Next</div>
            <div className="text-xs text-slate-400">Mulai analisis, lalu gunakan Results untuk export tabel.</div>
          </div>
          <Link
            href="/analyzer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Start Analyzer
          </Link>
        </div>
      </div>
    </main>
  );
}
