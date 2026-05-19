import "./globals.css";
import type { Metadata } from "next";
import HeaderNav from "../components/HeaderNav";

export const metadata: Metadata = {
  title: "KodeMetrik — Deep Source Code Complexity Analysis",
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
          <HeaderNav />

          {/* Main Content Area */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-500 no-print">
            <div className="mx-auto max-w-6xl px-4 text-center">
              © {new Date().getFullYear()} KodeMetrik. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
