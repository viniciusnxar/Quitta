"use client";

import { PiggyBankIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/money/money-input";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addExtraPayment,
  deleteExtraPayment,
} from "@/features/financings/actions";
import type { ExtraPayment, Financing } from "@/features/financings/queries";
import { EXTRA_STRATEGY_LABELS } from "@/features/financings/schema";
import { formatDate, today } from "@/lib/finance/dates";
import {
  EXTRA_STRATEGIES,
  simulateExtra,
  type ExtraStrategy,
  type ScheduleParams,
} from "@/lib/finance/financing";
import { formatBRL, fromCents, toCents } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

/** Lista das amortizações extras + botão que abre o simulador. */
export function ExtraPayments({
  financing,
  extras,
}: {
  financing: Financing;
  extras: ExtraPayment[];
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = financing.remaining_installments === 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">Amortização extraordinária</h2>
        {!done && (
          <Button
            variant="outline"
            className="h-11 gap-2"
            onClick={() => setOpen(true)}
          >
            <PiggyBankIcon /> Amortizar
          </Button>
        )}
      </div>

      {extras.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Pagou algo a mais? Simule quanto economiza em juros antes de lançar.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {extras.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium tabular-nums">
                  {formatBRL(e.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(e.payment_date)} ·{" "}
                  {EXTRA_STRATEGY_LABELS[e.strategy]}
                </span>
              </span>
              <Button
                variant={confirming === e.id ? "destructive" : "ghost"}
                className="h-11 gap-2"
                disabled={pending}
                aria-label="Remover amortização"
                onClick={() => {
                  // Primeiro toque arma; o segundo remove.
                  if (confirming !== e.id) return setConfirming(e.id);
                  startTransition(async () => {
                    const { error } = await deleteExtraPayment(e.id);
                    setConfirming(null);
                    if (error) toast.error(error);
                    else toast.success("Amortização removida.");
                  });
                }}
              >
                <Trash2Icon />
                {confirming === e.id && "Remover?"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Amortização extraordinária"
      >
        {open && (
          <ExtraPaymentForm
            financing={financing}
            extras={extras}
            onDone={() => setOpen(false)}
          />
        )}
      </ResponsiveDialog>
    </section>
  );
}

function ExtraPaymentForm({
  financing: f,
  extras,
  onDone,
}: {
  financing: Financing;
  extras: ExtraPayment[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [cents, setCents] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [strategy, setStrategy] = useState<ExtraStrategy>("reduzir_prazo");
  const maxCents = toCents(f.outstanding_balance);

  const params: ScheduleParams = {
    financedCents: toCents(f.financed_amount),
    interestRate: f.interest_rate,
    ratePeriod: f.rate_period,
    system: f.system,
    termMonths: f.term_months,
    firstDueDate: f.first_due_date,
    feesCents: toCents(f.monthly_fees),
  };
  const valid =
    !!cents && cents <= maxCents && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const sim = valid
    ? simulateExtra(
        params,
        extras.map((e) => ({
          date: e.payment_date,
          cents: toCents(e.amount),
          strategy: e.strategy,
        })),
        { date, cents, strategy },
      )
    : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!cents) return;
        startTransition(async () => {
          const { error } = await addExtraPayment(f.id, {
            payment_date: date,
            amount_cents: cents,
            strategy,
          });
          if (error) return void toast.error(error);
          toast.success("Amortização lançada e parcelas recalculadas.");
          onDone();
        });
      }}
      className="flex flex-col gap-4 pb-2"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Valor
          <MoneyInput
            value={cents}
            onChange={setCents}
            aria-invalid={!!cents && cents > maxCents}
          />
        </label>
        <label className={labelClass}>
          Data
          <Input
            type="date"
            className="h-11 text-base"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Saldo devedor: {formatBRL(f.outstanding_balance)}
      </p>

      <div className="grid grid-cols-2 gap-2" role="radiogroup">
        {EXTRA_STRATEGIES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={strategy === s}
            onClick={() => setStrategy(s)}
            className={cn(
              "h-11 rounded-md border text-sm font-medium",
              strategy === s && "border-primary bg-primary/10",
            )}
          >
            {EXTRA_STRATEGY_LABELS[s]}
          </button>
        ))}
      </div>

      {cents && cents > maxCents ? (
        <p className="text-sm text-destructive">
          O valor passa do saldo devedor.
        </p>
      ) : (
        sim && (
          <div
            className="flex flex-col gap-1 rounded-lg bg-muted p-3 text-sm"
            aria-live="polite"
          >
            <p>
              Economia de juros:{" "}
              <strong className="text-green-700 tabular-nums dark:text-green-500">
                {formatBRL(fromCents(sim.interestSavedCents))}
              </strong>
            </p>
            {strategy === "reduzir_prazo" ? (
              <p>
                {sim.monthsSaved > 0
                  ? `${sim.monthsSaved} parcela${sim.monthsSaved > 1 ? "s" : ""} a menos`
                  : "Prazo igual"}
                {sim.lastDueDate &&
                  ` · termina em ${formatDate(sim.lastDueDate)}`}
              </p>
            ) : (
              <p className="tabular-nums">
                Parcela: {formatBRL(fromCents(sim.installmentBefore))} →{" "}
                {formatBRL(fromCents(sim.installmentAfter))}
              </p>
            )}
            {!sim.lastDueDate && <p>Quita o financiamento.</p>}
          </div>
        )
      )}

      <p className="text-xs text-muted-foreground">
        O valor sai da conta de débito como despesa
        {date > today() ? " prevista" : ""}.
      </p>

      <Button type="submit" className="h-11" disabled={pending || !valid}>
        {pending ? "Recalculando..." : "Lançar amortização"}
      </Button>
    </form>
  );
}
