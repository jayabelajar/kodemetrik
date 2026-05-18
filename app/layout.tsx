import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Metric Analyzer",
  description: "Analyze Cyclomatic Complexity and Halstead metrics for JavaScript and PHP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}

