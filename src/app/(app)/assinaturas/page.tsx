import { Suspense } from "react";
import { SubscriptionsView } from "@/components/subscriptions/subscriptions-view";
import {
  listPriceChanges,
  listSubscriptions,
} from "@/features/subscriptions/queries";
import { loadTransactionOptions } from "@/features/transactions/actions";

export default function SubscriptionsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<Skeleton />}>
        <Subscriptions />
      </Suspense>
    </div>
  );
}

async function Subscriptions() {
  const [subscriptions, priceChanges, options] = await Promise.all([
    listSubscriptions(),
    listPriceChanges(),
    loadTransactionOptions(),
  ]);
  return (
    <SubscriptionsView
      subscriptions={subscriptions}
      priceChanges={priceChanges}
      options={options}
    />
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
