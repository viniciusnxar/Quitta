"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadMoreTransactions } from "@/features/transactions/actions";
import { groupByDay, signedCents } from "@/features/transactions/group";
import type {
  TransactionItem,
  TransactionPage,
} from "@/features/transactions/queries";
import { formatDate, today } from "@/lib/finance/dates";
import { formatBRL, fromCents } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export function TransactionList({
  first,
  search,
  filtered,
}: {
  first: TransactionPage;
  /** Filtros atuais, para as próximas páginas virem com os mesmos critérios. */
  search: string;
  filtered: boolean;
}) {
  // Páginas extras pertencem à primeira página que as originou: se o servidor
  // revalidar (nova transação, filtro novo), a lista recomeça do topo.
  const [more, setMore] = useState({
    base: first,
    pages: [] as TransactionPage[],
  });
  const pages = more.base === first ? more.pages : [];
  const next = (pages.at(-1) ?? first).next;
  const [pending, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = () => {
    if (!next || pending) return;
    startTransition(async () => {
      try {
        const page = await loadMoreTransactions(search, next);
        setMore({ base: first, pages: [...pages, page] });
      } catch {
        toast.error("Não foi possível carregar mais transações.");
      }
    });
  };

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadMore(),
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  });

  const items = [first, ...pages].flatMap((p) => p.items);
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        {filtered
          ? "Nenhuma transação encontrada com esses filtros."
          : "Nenhuma transação ainda. Toque em + para lançar a primeira."}
      </p>
    );
  }

  const now = today();
  return (
    <div className="flex flex-col gap-4">
      {groupByDay(items).map((day) => (
        <section key={day.date} aria-label={formatDate(day.date)}>
          <header className="flex items-baseline justify-between px-1 pb-1 text-sm text-muted-foreground">
            <h2 className="font-medium">
              {day.date === now
                ? "Hoje"
                : formatDate(day.date, "EEEE, dd 'de' MMM")}
            </h2>
            <span className="tabular-nums">
              {formatBRL(fromCents(day.totalCents))}
            </span>
          </header>
          <ul className="divide-y rounded-lg border">
            {day.items.map((t) => (
              <Row key={t.id} transaction={t} />
            ))}
          </ul>
        </section>
      ))}

      {next && (
        <div ref={sentinel} className="flex justify-center">
          <Button
            variant="ghost"
            className="h-11"
            disabled={pending}
            onClick={loadMore}
          >
            {pending ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ transaction: t }: { transaction: TransactionItem }) {
  const planned = t.status === "previsto";
  const cancelled = t.status === "cancelado";
  const cents = signedCents({ ...t, status: "pago" });
  const where =
    t.type === "transferencia"
      ? `${t.account?.name ?? "?"} → ${t.to_account?.name ?? "?"}`
      : (t.card?.name ?? t.account?.name);

  return (
    <li
      className={cn(
        "flex min-h-14 items-center gap-3 px-3 py-2",
        (planned || cancelled) && "opacity-60",
      )}
    >
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: t.category?.color ?? "#a3a3a3" }}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium", cancelled && "line-through")}>
          {t.description}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          {planned && <ClockIcon className="size-3" aria-label="Previsto" />}
          {[t.category?.name, where].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span
        className={cn(
          "font-medium whitespace-nowrap tabular-nums",
          cents > 0 && "text-green-600",
          cents < 0 && "text-red-600",
        )}
      >
        {cents > 0 && "+"}
        {formatBRL(cents === 0 ? t.amount : fromCents(cents))}
      </span>
    </li>
  );
}
