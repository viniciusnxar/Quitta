import { Suspense } from "react";
import { InvestmentsView } from "@/components/investments/investments-view";
import { listAccounts } from "@/features/accounts/queries";
import { listInvestments } from "@/features/investments/queries";

export default function InvestmentsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<Skeleton />}>
        <Investments />
      </Suspense>
    </div>
  );
}

async function Investments() {
  const [investments, accounts] = await Promise.all([
    listInvestments(),
    listAccounts(),
  ]);
  return (
    <InvestmentsView
      investments={investments}
      accounts={accounts.filter((a) => !a.archived_at)}
    />
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
