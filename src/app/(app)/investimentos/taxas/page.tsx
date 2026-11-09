import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { RatesView } from "@/components/investments/rates-view";
import { getLatestRates } from "@/features/investments/queries";

export default function RatesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/investimentos"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 text-sm text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Investimentos
      </Link>
      <h1 className="text-2xl font-semibold">Taxas de referência</h1>
      <p className="text-sm text-muted-foreground">
        Usadas nas projeções. Os valores padrão são exemplos: confira as taxas
        atuais no site do Banco Central e salve as suas.
      </p>
      <Suspense
        fallback={
          <div className="h-80 animate-pulse rounded-lg bg-muted" aria-busy />
        }
      >
        <Rates />
      </Suspense>
    </div>
  );
}

async function Rates() {
  const { rows } = await getLatestRates();
  return <RatesView key={rows.map((r) => r.annual_rate).join()} rows={rows} />;
}
