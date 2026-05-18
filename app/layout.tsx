import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CodeMetrik — Deep Source Code Complexity Analysis",
  description: "High-performance developer tool to measure Cyclomatic Complexity, Halstead Metrics, and render interactive Control Flow Graphs client-side.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased bg-dot-pattern selection:bg-blue-500/20 selection:text-blue-300">
        {/* Decorative subtle ambient glows */}
        <div className="pointer-events-none fixed left-1/4 top-0 -z-10 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="pointer-events-none fixed right-1/4 bottom-0 -z-10 h-[350px] w-[600px] translate-x-1/2 rounded-full bg-indigo-600/5 blur-[120px]" />

        <div className="flex min-h-screen flex-col">
          {/* Header Navigation */}
           <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/75 backdrop-blur-md no-print">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-blue-400 shadow-md group-hover:border-slate-700 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:rotate-12 transition-transform duration-300"
                  >
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                  CodeMetrik
                </span>
              </Link>

              <div className="flex items-center gap-5">
                <nav className="hidden items-center gap-5 text-xs font-semibold md:flex">
                  <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
                    Overview
                  </Link>
                  <Link href="/analyzer" className="text-slate-400 hover:text-slate-200 transition-colors">
                    Analyzer Console
                  </Link>
                </nav>
                <span className="hidden h-4 w-px bg-slate-800 md:inline-block" />
                <Link
                  href="/analyzer"
                  className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  Start Analyzer
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-500 no-print">
            <div className="mx-auto max-w-6xl px-4 text-center">
              © {new Date().getFullYear()} CodeMetrik. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

