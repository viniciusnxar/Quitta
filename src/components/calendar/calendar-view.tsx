"use client";

import { CheckIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { monthGrid } from "@/features/calendar/grid";
import type {
  CalendarEvent,
  CalendarEventType,
} from "@/features/calendar/queries";
import { setTransactionPaid } from "@/features/transactions/actions";
import { formatDate, today } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

const TYPE_STYLE: Record<CalendarEventType, { dot: string; label: string }> = {
  receita: { dot: "bg-green-600", label: "Receita" },
  despesa: { dot: "bg-red-600", label: "Despesa" },
  transferencia: { dot: "bg-blue-600", label: "Transferência" },
  pagamento_fatura: { dot: "bg-violet-600", label: "Vencimento de fatura" },
  fechamento: { dot: "bg-amber-500", label: "Fechamento de fatura" },
};
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const toggleClass =
  "flex h-11 flex-1 items-center justify-center rounded-md border text-sm aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:font-medium";

export function CalendarView({
  month,
  events,
}: {
  month: string;
  events: CalendarEvent[];
}) {
  const [view, setView] = useState<"mes" | "agenda">("mes");
  const [day, setDay] = useState<string | null>(null);
  // Eventos já vêm ordenados por data.
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  const now = today();

  return (
    <>
      <div role="group" aria-label="Visão" className="flex gap-2">
        <button
          type="button"
          aria-pressed={view === "mes"}
          className={toggleClass}
          onClick={() => setView("mes")}
        >
          Mês
        </button>
        <button
          type="button"
          aria-pressed={view === "agenda"}
          className={toggleClass}
          onClick={() => setView("agenda")}
        >
          Agenda
        </button>
      </div>

      {view === "mes" ? (
        <div className="flex flex-col gap-3">
          <table className="w-full table-fixed border-collapse text-center">
            <thead>
              <tr className="text-xs text-muted-foreground">
                {WEEKDAYS.map((d, i) => (
                  <th key={i} className="py-1 font-normal">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid(month).map((week, w) => (
                <tr key={w}>
                  {week.map((date, i) => {
                    if (!date) return <td key={i} />;
                    const items = byDay.get(date) ?? [];
                    const types = [...new Set(items.map((e) => e.type))];
                    return (
                      <td key={date} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => setDay(date)}
                          aria-label={`${formatDate(date, "d 'de' MMMM")}: ${items.length} ${items.length === 1 ? "item" : "itens"}`}
                          className={cn(
                            "flex h-14 w-full flex-col items-center justify-start gap-1 rounded-md pt-1.5 text-sm hover:bg-accent",
                            date === now && "bg-accent font-semibold",
                          )}
                        >
                          {Number(date.slice(8))}
                          <span className="flex flex-wrap justify-center gap-0.5">
                            {types.map((t) => (
                              <span
                                key={t}
                                className={cn(
                                  "size-1.5 rounded-full",
                                  TYPE_STYLE[t].dot,
                                )}
                              />
                            ))}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {Object.values(TYPE_STYLE).map((s) => (
              <li key={s.label} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", s.dot)} />
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nada neste mês.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {[...byDay].map(([date, items]) => (
            <section key={date}>
              <h2
                className={cn(
                  "mb-1 text-sm font-medium text-muted-foreground",
                  date === now && "text-foreground",
                )}
              >
                {formatDate(date, "EEEE, d 'de' MMMM")}
              </h2>
              <EventList items={items} />
            </section>
          ))}
        </div>
      )}

      <ResponsiveDialog
        open={day !== null}
        onOpenChange={(o) => !o && setDay(null)}
        title={day ? formatDate(day, "EEEE, d 'de' MMMM") : ""}
      >
        {day && (
          <div className="pb-2">
            {(byDay.get(day) ?? []).length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                Nada neste dia.
              </p>
            ) : (
              <EventList items={byDay.get(day) ?? []} />
            )}
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
}

function EventList({ items }: { items: CalendarEvent[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((e) => (
        <EventRow key={`${e.source}:${e.id}`} e={e} />
      ))}
    </ul>
  );
}

function EventRow({ e }: { e: CalendarEvent }) {
  const [pending, startTransition] = useTransition();
  const pendingTx = e.source === "transacao" && e.status === "previsto";
  const content = (
    <>
      <span
        className={cn("size-2.5 shrink-0 rounded-full", TYPE_STYLE[e.type].dot)}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 truncate">
          {pendingTx && (
            <ClockIcon
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-label="previsto"
            />
          )}
          <span className={cn("truncate", pendingTx && "opacity-70")}>
            {e.title}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {TYPE_STYLE[e.type].label}
        </span>
      </span>
      <span
        className={cn(
          "tabular-nums",
          e.type === "receita" && "text-green-700 dark:text-green-500",
          e.type === "despesa" && "text-red-600",
          pendingTx && "opacity-70",
        )}
      >
        {formatBRL(e.amount)}
      </span>
    </>
  );

  return (
    <li className="flex min-h-14 items-center gap-3 px-3 py-2">
      {e.cardId && e.source !== "transacao" ? (
        <Link
          href={`/cartoes/${e.cardId}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          {content}
        </Link>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {content}
        </span>
      )}
      {pendingTx && (
        <Button
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          aria-label={`Marcar ${e.title} como pago`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const { error } = await setTransactionPaid(e.id, true);
              if (error) toast.error(error);
              else toast.success("Marcado como pago.");
            })
          }
        >
          <CheckIcon />
        </Button>
      )}
    </li>
  );
}
