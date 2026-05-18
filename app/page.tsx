import Link from "next/link";

const MetricFeature = ({
  icon,
  title,
  subtitle,
  desc,
  metrics,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  desc: string;
  metrics: { name: string; value: string }[];
}) => (
  <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/30 p-6 md:p-8 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-900/50">
    <div className="absolute top-0 right-0 -z-10 h-[100px] w-[100px] rounded-full bg-blue-500/5 opacity-0 blur-[30px] transition-opacity group-hover:opacity-100" />
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-blue-400">
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
          {subtitle}
        </span>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      </div>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-slate-400">{desc}</p>
    {metrics && metrics.length > 0 && (
      <div className="mt-6 border-t border-slate-800/80 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div key={m.name} className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {m.name}
              </span>
              <p className="font-mono text-xs font-semibold text-slate-300">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const StepCard = ({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 hover:border-slate-700 transition-colors">
    <span className="font-mono text-xs font-bold text-blue-400">
      {num}
    </span>
    <h4 className="mt-2 text-sm font-semibold text-slate-200">{title}</h4>
    <p className="mt-1 text-xs leading-normal text-slate-400">{desc}</p>
  </div>
);

export default function LandingPage() {
  return (
    <main className="space-y-16">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center py-8 md:py-16">
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent leading-none">
          Measure code quality.<br />Refactor with absolute confidence.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400">
          Paste your code, upload a single file, or drop an entire folder. Get instant client-side analysis for Cyclomatic Complexity, Halstead metrics, and interactive Control Flow Graphs.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/analyzer"
            className="group relative rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-md shadow-blue-500/10 hover:scale-[1.02]"
          >
            Open Analyzer Console
          </Link>
          <a
            href="#metrics-specs"
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all"
          >
            Learn Specifications
          </a>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StepCard
          num="01. CHOOSE INPUT METHOD"
          title="Paste Direct &amp; Upload"
          desc="Write or paste code directly into our virtual IDE editor, upload a single file, or upload a complete directory."
        />
        <StepCard
          num="02. STATIC ANALYSIS"
          title="AST Parsing &amp; Graphing"
          desc="Fully parsed on the client side using high-speed AST parsers. Instantly generates structural control flow visual graphs."
        />
        <StepCard
          num="03. METRIC REPORTS"
          title="Visual Diagnosis"
          desc="Get visual complexity status, comprehensive Halstead metric breakdowns, and smart automated refactoring recommendations."
        />
      </section>

      {/* Metrics Detail Section */}
      <section id="metrics-specs" className="space-y-6 scroll-mt-20">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Analysis Engine Specifications
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Powered by industry-standard mathematical software complexity models.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <MetricFeature
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-8-4-8 4z" />
              </svg>
            }
            subtitle="Complexity Model"
            title="Cyclomatic Complexity (McCabe)"
            desc="Calculates the number of linearly independent paths through your code. High complexity flags code that is harder to test, debug, and maintain."
            metrics={[
              { name: "Complexity 1-10", value: "Excellent (Simple & Stable)" },
              { name: "Complexity 11-20", value: "Moderate (Medium Risk)" },
              { name: "Complexity >20", value: "High (Critical - Redesign Recommended)" },
              { name: "Parser Engine", value: "Client-Side AST Walker" },
            ]}
          />

          <MetricFeature
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            }
            subtitle="Quantitative Science"
            title="Halstead Complexity Metrics"
            desc="Calculates program complexity metrics based on operator and operand counts. Delivers scientific insights on vocabulary, length, volume, effort, and bug density."
            metrics={[
              { name: "Core Metrics", value: "Vocabulary & Volume" },
              { name: "Diagnostic Size", value: "Difficulty & Effort" },
              { name: "Quality Estimation", value: "Metric Bug Density" },
              { name: "Development Time", value: "Estimated Programming Time" },
            ]}
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900/50 to-slate-950 p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.08),rgba(255,255,255,0))]" />
        <h2 className="text-xl font-semibold md:text-2xl text-slate-100">
          Ready to analyze your project code quality?
        </h2>
        <p className="mt-2 text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
          Full support for JavaScript (ES6+) and PHP. 100% client-side execution guarantees your proprietary code never leaves your computer.
        </p>
        <div className="mt-6">
          <Link
            href="/analyzer"
            className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-md hover:scale-[1.01]"
          >
            Open Analyzer Console
          </Link>
        </div>
      </section>
    </main>
  );
}

