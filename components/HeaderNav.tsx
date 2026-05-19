"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function BurgerIcon({ open }: { open: boolean }) {
  return (
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
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </>
      ) : (
        <>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </>
      )}
    </svg>
  );
}

export default function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
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
              <path d="M8 9 4 12l4 3" />
              <path d="m16 9 4 3-4 3" />
              <path d="M14 7 10 17" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-white transition-colors">
            KodeMetrik
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <nav className="hidden items-center gap-5 text-xs font-semibold md:flex">
            <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
              Overview
            </Link>
            <Link href="/analyzer" className="text-slate-400 hover:text-slate-200 transition-colors">
              Analyzer Console
            </Link>
            <Link href="/docs" className="text-slate-400 hover:text-slate-200 transition-colors">
              Docs
            </Link>
          </nav>

          <span className="hidden h-4 w-px bg-slate-800 md:inline-block" />

          <Link
            href="/analyzer"
            className="hidden rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/10 md:inline-flex"
          >
            Start Analyzer
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-800 bg-slate-950/50 text-slate-200 transition-colors hover:bg-slate-900 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <BurgerIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-14 z-50 border-b border-slate-900 bg-slate-950/95 backdrop-blur-md md:hidden">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="grid gap-2 text-sm font-semibold">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-900/70"
                  onClick={() => setOpen(false)}
                >
                  Overview
                </Link>
                <Link
                  href="/analyzer"
                  className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-900/70"
                  onClick={() => setOpen(false)}
                >
                  Analyzer Console
                </Link>
                <Link
                  href="/docs"
                  className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-900/70"
                  onClick={() => setOpen(false)}
                >
                  Docs
                </Link>
                <div className="mt-2">
                  <Link
                    href="/analyzer"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    onClick={() => setOpen(false)}
                  >
                    Start Analyzer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

