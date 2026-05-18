import ResultsClient from "@/app/results/ResultsClient";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const idRaw = sp?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  return <ResultsClient initialId={id} />;
}

