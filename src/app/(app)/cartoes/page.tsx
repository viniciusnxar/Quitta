import { Suspense } from "react";
import { CardsView } from "@/components/cards/cards-view";
import { listAccounts } from "@/features/accounts/queries";
import { listCards } from "@/features/cards/queries";

export default function CardsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<Skeleton />}>
        <Cards />
      </Suspense>
    </div>
  );
}

async function Cards() {
  const [cards, accounts] = await Promise.all([listCards(), listAccounts()]);
  return (
    <CardsView
      cards={cards}
      accounts={accounts
        .filter((a) => !a.archived_at)
        .map(({ id, name }) => ({ id, name }))}
    />
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 w-40 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
