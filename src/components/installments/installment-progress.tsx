import { ProgressBar } from "@/components/progress-bar";
import type { InstallmentPlan } from "@/features/installments/queries";
import { formatDate } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";

/** "4/10 pagas", barra, restante e próxima parcela. */
export function InstallmentProgress({ plan: p }: { plan: InstallmentPlan }) {
  const pct =
    p.installment_count > 0
      ? Math.round((p.paid_installments / p.installment_count) * 100)
      : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <ProgressBar
        pct={pct}
        label="Parcelas pagas"
        valueText={`${p.paid_installments} de ${p.installment_count} parcelas pagas`}
        className={p.is_active ? "bg-primary" : "bg-green-600"}
      />
      <div className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>
          {p.paid_installments}/{p.installment_count} pagas
        </span>
        <span>
          {p.is_active ? `Falta ${formatBRL(p.remaining_amount)}` : "Quitado"}
        </span>
      </div>
      {p.next_date && (
        <p className="text-xs text-muted-foreground">
          Próxima: {formatDate(p.next_date)} · {formatBRL(p.installment_amount)}
        </p>
      )}
    </div>
  );
}
