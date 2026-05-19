"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LatestResultsLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = useState("/results");

  useEffect(() => {
    try {
      const id = localStorage.getItem("codemetrik_latest_result_id");
      if (id) setHref(`/results?id=${encodeURIComponent(id)}`);
    } catch {
      // ignore (SSR / blocked storage)
    }
  }, []);

  return (
    <Link href={href} className={className} title="Open latest analysis results">
      {children}
    </Link>
  );
}

