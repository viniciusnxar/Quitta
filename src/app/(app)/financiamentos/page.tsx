import { Suspense } from "react";
import { FinancingsView } from "@/components/financings/financings-view";
import { listFinancings } from "@/features/financings/queries";
import { loadTransactionOptions } from "@/features/transactions/actions";

export default function FinancingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<Skeleton />}>
        <Financings />
      </Suspense>
    </div>
  );
}

async function Financings() {
  const [financings, options] = await Promise.all([
    listFinancings(),
    loadTransactionOptions(),
  ]);
  return <FinancingsView financings={financings} options={options} />;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 w-56 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
