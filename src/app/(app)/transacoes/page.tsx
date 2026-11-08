import { createSerializer } from "nuqs/server";
import { Suspense } from "react";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { loadTransactionOptions } from "@/features/transactions/actions";
import {
  countFilters,
  filterParsers,
  loadFilters,
} from "@/features/transactions/filters";
import { listTransactions } from "@/features/transactions/queries";

const serialize = createSerializer(filterParsers);

export default function TransactionsPage({
  searchParams,
}: PageProps<"/transacoes">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Transações</h1>
      <Suspense fallback={<div className="h-11 rounded-md bg-muted" />}>
        <Filters />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <Transactions searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Filters() {
  return <TransactionFilters options={await loadTransactionOptions()} />;
}

async function Transactions({
  searchParams,
}: Pick<PageProps<"/transacoes">, "searchParams">) {
  const filters = loadFilters(await searchParams);
  return (
    <TransactionList
      first={await listTransactions(filters, null)}
      search={serialize(filters)}
      emptyText={
        countFilters(filters) > 0 || filters.q
          ? "Nenhuma transação encontrada com esses filtros."
          : "Nenhuma transação ainda. Toque em + para lançar a primeira."
      }
    />
  );
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
