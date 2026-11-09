import { Suspense } from "react";
import { RecurringView } from "@/components/recurring/recurring-view";
import { listRecurringRules } from "@/features/recurring/queries";
import { loadTransactionOptions } from "@/features/transactions/actions";

export default function RecurringPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<Skeleton />}>
        <Recurring />
      </Suspense>
    </div>
  );
}

async function Recurring() {
  const [rules, options] = await Promise.all([
    listRecurringRules(),
    loadTransactionOptions(),
  ]);
  return <RecurringView rules={rules} options={options} />;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 w-56 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
