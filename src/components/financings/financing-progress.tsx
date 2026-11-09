import { ProgressBar } from "@/components/progress-bar";
import type { Financing } from "@/features/financings/queries";
import { formatDate } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";

/** Parcelas pagas, saldo devedor e próxima parcela. */
export function FinancingProgress({ financing: f }: { financing: Financing }) {
  const total = f.paid_installments + f.remaining_installments;
  const done = total > 0 && f.remaining_installments === 0;
  return (
    <div className="flex flex-col gap-1.5">
      <ProgressBar
        pct={total > 0 ? Math.round((f.paid_installments / total) * 100) : 0}
        label="Parcelas pagas"
        valueText={`${f.paid_installments} de ${total} parcelas pagas`}
        className={done ? "bg-green-600" : "bg-primary"}
      />
      <div className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>
          {f.paid_installments}/{total} pagas
        </span>
        <span>
          {done ? "Quitado" : `Saldo ${formatBRL(f.outstanding_balance)}`}
        </span>
      </div>
      {f.next_due_date && f.next_amount != null && (
        <p className="text-xs text-muted-foreground">
          Próxima: {formatDate(f.next_due_date)} · {formatBRL(f.next_amount)}
        </p>
      )}
    </div>
  );
}
