"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/money/money-input";
import { ProgressBar } from "@/components/progress-bar";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { deleteBudget, saveBudget } from "@/features/budgets/actions";
import type { BudgetRow } from "@/features/budgets/resolve";
import { formatMonth } from "@/lib/finance/dates";
import { formatBRL, fromCents, toCents } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export type BudgetLine = {
  /** null = limite global. */
  categoryId: string | null;
  name: string;
  color: string | null;
  /** Gasto do mês com previstos, em centavos. */
  committedCents: number;
  /** Só o já realizado (global). */
  spentCents?: number;
  budget: BudgetRow | null;
};

const toggleClass =
  "flex h-11 flex-1 items-center justify-center rounded-md border text-sm aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:font-medium";

export function BudgetView({
  month,
  global,
  categories,
}: {
  month: string;
  global: BudgetLine;
  categories: BudgetLine[];
}) {
  const [editing, setEditing] = useState<BudgetLine | null>(null);
  const withBudget = categories.filter((c) => c.budget);
  const without = categories.filter((c) => !c.budget);

  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(global)}
        className="flex flex-col gap-3 rounded-lg border p-4 text-left hover:bg-accent"
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-medium">Limite de gastos do mês</span>
          <span className="text-sm text-muted-foreground">
            {global.budget ? "Editar" : "Definir"}
          </span>
        </span>
        {global.budget ? (
          <>
            <Remaining line={global} large />
            <BudgetBar line={global} />
            <span className="text-xs text-muted-foreground tabular-nums">
              Já gasto {formatBRL(fromCents(global.spentCents ?? 0))} · com
              previstos {formatBRL(fromCents(global.committedCents))}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Gasto no mês até agora (com previstos):{" "}
            {formatBRL(fromCents(global.committedCents))}. Defina um limite para
            ver quanto ainda pode gastar.
          </span>
        )}
      </button>

      <h2 className="font-medium">Por categoria</h2>
      {withBudget.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {withBudget.map((c) => (
            <li key={c.categoryId}>
              <button
                type="button"
                onClick={() => setEditing(c)}
                className="flex w-full flex-col gap-2 px-3 py-3 text-left hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <Dot color={c.color} />
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  <Remaining line={c} />
                </span>
                <BudgetBar line={c} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {without.length > 0 && (
        <details open={withBudget.length === 0}>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Sem limite ({without.length})
          </summary>
          <ul className="divide-y rounded-lg border">
            {without.map((c) => (
              <li key={c.categoryId}>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="flex min-h-12 w-full items-center gap-2 px-3 text-left hover:bg-accent"
                >
                  <Dot color={c.color} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {formatBRL(fromCents(c.committedCents))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={
          editing?.categoryId ? `Limite: ${editing.name}` : "Limite do mês"
        }
      >
        {editing && (
          <BudgetForm
            key={editing.categoryId ?? "global"}
            line={editing}
            month={month}
            onDone={() => setEditing(null)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}

function pctOf(line: BudgetLine) {
  const limit = toCents(line.budget?.amount ?? 0);
  return limit > 0 ? Math.round((line.committedCents / limit) * 100) : 100;
}

/** Verde até 70%, amarela até 100%, vermelha estourado. */
function BudgetBar({ line }: { line: BudgetLine }) {
  const pct = pctOf(line);
  return (
    <ProgressBar
      pct={pct}
      label={`Orçamento de ${line.name}`}
      valueText={`${pct}% do limite`}
      className={
        pct < 70 ? "bg-green-600" : pct <= 100 ? "bg-amber-500" : "bg-red-600"
      }
    />
  );
}

function Remaining({ line, large }: { line: BudgetLine; large?: boolean }) {
  const left = toCents(line.budget?.amount ?? 0) - line.committedCents;
  return (
    <span className="flex flex-col items-end tabular-nums">
      <span
        className={cn(
          "font-semibold",
          large && "text-2xl",
          left < 0 && "text-red-600",
        )}
      >
        {formatBRL(fromCents(Math.abs(left)))}
      </span>
      <span className="text-xs text-muted-foreground">
        {left < 0 ? "acima" : "restam"} de {formatBRL(line.budget?.amount ?? 0)}
      </span>
    </span>
  );
}

function Dot({ color }: { color: string | null }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? "#a3a3a3" }}
    />
  );
}

function BudgetForm({
  line,
  month,
  onDone,
}: {
  line: BudgetLine;
  month: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [cents, setCents] = useState<number | null>(
    line.budget ? toCents(line.budget.amount) : null,
  );
  // Começa como está: valor específico do mês ou padrão.
  const [everyMonth, setEveryMonth] = useState(
    line.budget?.month !== `${month}-01`,
  );
  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await fn();
      if (error) return void toast.error(error);
      toast.success(ok);
      onDone();
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!cents) return void toast.error("Informe o valor.");
        run(
          () =>
            saveBudget({
              category_id: line.categoryId,
              amount_cents: cents,
              month,
              every_month: everyMonth,
            }),
          "Limite salvo.",
        );
      }}
      className="flex flex-col gap-4 pb-2"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Limite
        <MoneyInput autoFocus value={cents} onChange={setCents} />
      </label>

      <div role="group" aria-label="Vale para" className="flex gap-2">
        <button
          type="button"
          aria-pressed={everyMonth}
          className={toggleClass}
          onClick={() => setEveryMonth(true)}
        >
          Todo mês
        </button>
        <button
          type="button"
          aria-pressed={!everyMonth}
          className={toggleClass}
          onClick={() => setEveryMonth(false)}
        >
          Só {formatMonth(month)}
        </button>
      </div>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
      {line.budget && (
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-destructive"
          disabled={pending}
          onClick={() =>
            run(() => deleteBudget(line.budget!.id), "Limite removido.")
          }
        >
          {line.budget.month
            ? `Remover limite de ${formatMonth(month)}`
            : "Remover limite"}
        </Button>
      )}
    </form>
  );
}
