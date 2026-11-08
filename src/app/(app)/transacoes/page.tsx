import { Suspense } from "react";
import { TransactionList } from "@/components/transactions/transaction-list";
import { listTransactions } from "@/features/transactions/queries";

export default function TransactionsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Transações</h1>
      <Suspense fallback={<Skeleton />}>
        <Transactions />
      </Suspense>
    </div>
  );
}

async function Transactions() {
  return <TransactionList first={await listTransactions(null)} />;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {[3, 2, 4].map((rows, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div
            className="animate-pulse rounded-lg bg-muted"
            style={{ height: rows * 56 }}
          />
        </div>
      ))}
    </div>
  );
}
