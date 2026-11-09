import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { FinancingChart } from "@/components/financings/financing-chart";
import { FinancingEditButton } from "@/components/financings/financing-edit-button";
import { FinancingProgress } from "@/components/financings/financing-progress";
import {
  getFinancing,
  listFinancingInstallments,
} from "@/features/financings/queries";
import {
  FINANCING_KIND_LABELS,
  RATE_PERIOD_LABELS,
  SYSTEM_LABELS,
} from "@/features/financings/schema";
import { loadTransactionOptions } from "@/features/transactions/actions";
import { formatDate } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export default function FinancingPage(
  props: PageProps<"/financiamentos/[id]">,
) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/financiamentos"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 text-sm text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Financiamentos
      </Link>
      <Suspense fallback={<Skeleton />}>
        <FinancingDetail {...props} />
      </Suspense>
    </div>
  );
}

async function FinancingDetail({ params }: PageProps<"/financiamentos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [f, options] = await Promise.all([
    getFinancing(id),
    loadTransactionOptions(),
  ]);
  if (!f) notFound();
  const installments = await listFinancingInstallments(
    id,
    f.paid_installments_before,
  );
  const rate = f.interest_rate.toLocaleString("pt-BR", {
    maximumFractionDigits: 4,
  });

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{f.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[
              FINANCING_KIND_LABELS[f.kind],
              f.institution,
              SYSTEM_LABELS[f.system].split(" ")[0],
              f.system !== "sem_juros" &&
                `${rate}% ${RATE_PERIOD_LABELS[f.rate_period]}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <FinancingEditButton financing={f} options={options} />
      </header>

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat
            label="Saldo devedor"
            value={formatBRL(f.outstanding_balance)}
          />
          <Stat
            label="Próxima parcela"
            value={f.next_amount != null ? formatBRL(f.next_amount) : "—"}
            hint={f.next_due_date ? formatDate(f.next_due_date) : undefined}
          />
          <Stat label="Financiado" value={formatBRL(f.financed_amount)} />
          <Stat
            label="Juros a pagar"
            value={formatBRL(f.total_interest_remaining)}
          />
        </div>
        <FinancingProgress financing={f} />
      </section>

      {installments.length > 0 && (
        <>
          <h2 className="font-medium">Juros x amortização</h2>
          <div className="rounded-lg border p-2">
            <FinancingChart installments={installments} />
          </div>

          <h2 className="font-medium">Parcelas</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm tabular-nums">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr className="text-right [&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
                  <th className="text-left">Nº</th>
                  <th className="text-left">Vencimento</th>
                  <th>Parcela</th>
                  <th>Juros</th>
                  <th>Amortização</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {installments.map((i) => (
                  <tr
                    key={i.id}
                    className={cn(
                      "text-right whitespace-nowrap [&>td]:px-3 [&>td]:py-2",
                      i.paid && "text-muted-foreground",
                    )}
                  >
                    <td className="text-left">
                      <span className="inline-flex items-center gap-1">
                        {i.number}
                        {i.paid && (
                          <CheckIcon
                            className="size-3.5 text-green-600"
                            aria-label="paga"
                          />
                        )}
                      </span>
                    </td>
                    <td className="text-left">{formatDate(i.due_date)}</td>
                    <td className="font-medium">{formatBRL(i.total)}</td>
                    <td>{formatBRL(i.interest)}</td>
                    <td>{formatBRL(i.amortization)}</td>
                    <td>{formatBRL(i.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-12 animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-56 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
