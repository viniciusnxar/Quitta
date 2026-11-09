"use client";

import { PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  deleteRecurringRule,
  setRecurringActive,
} from "@/features/recurring/actions";
import type { RecurringRule } from "@/features/recurring/queries";
import { CYCLE_LABELS } from "@/features/subscriptions/schema";
import type { TransactionOptions } from "@/features/transactions/actions";
import { TYPE_LABELS } from "@/features/transactions/schema";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";
import { RecurringForm } from "./recurring-form";

export function RecurringView({
  rules,
  options,
}: {
  rules: RecurringRule[];
  options: TransactionOptions;
}) {
  // undefined = fechado; null = nova.
  const [editing, setEditing] = useState<RecurringRule | null | undefined>();
  const close = () => setEditing(undefined);
  const active = rules.filter((r) => r.is_active);
  const paused = rules.filter((r) => !r.is_active);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recorrências</h1>
        <Button className="h-11 gap-2" onClick={() => setEditing(null)}>
          <PlusIcon /> Nova
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma recorrência. Cadastre salário, aluguel, contas fixas ou
          transferências programadas e o app lança tudo automaticamente.
        </p>
      ) : (
        <RuleList rules={active} onSelect={setEditing} />
      )}

      {paused.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Pausadas ({paused.length})
          </summary>
          <RuleList rules={paused} onSelect={setEditing} />
        </details>
      )}

      <ResponsiveDialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && close()}
        title={editing ? "Editar recorrência" : "Nova recorrência"}
      >
        {editing !== undefined && (
          <div key={editing?.id ?? "new"} className="flex flex-col gap-2">
            <RecurringForm rule={editing} options={options} onDone={close} />
            {editing && <RuleManage rule={editing} onDone={close} />}
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
}

function RuleList({
  rules,
  onSelect,
}: {
  rules: RecurringRule[];
  onSelect: (r: RecurringRule) => void;
}) {
  return (
    <ul className="divide-y rounded-lg border">
      {rules.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => onSelect(r)}
            className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{r.description}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[
                  TYPE_LABELS[r.type],
                  CYCLE_LABELS[r.cycle],
                  r.type === "transferencia"
                    ? `${r.account?.name} → ${r.to_account?.name}`
                    : (r.card?.name ?? r.account?.name),
                  r.auto_confirm && "automático",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span
              className={cn(
                "font-medium tabular-nums",
                r.type === "receita" && "text-green-700 dark:text-green-500",
              )}
            >
              {formatBRL(r.amount)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Pausar/reativar e excluir (dois toques). */
function RuleManage({
  rule,
  onDone,
}: {
  rule: RecurringRule;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await fn();
      if (error) return void toast.error(error);
      toast.success(ok);
      onDone();
    });

  return (
    <div className="flex flex-col gap-2 border-t pt-4 pb-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-11"
          disabled={pending}
          onClick={() =>
            run(
              () => setRecurringActive(rule.id, !rule.is_active),
              rule.is_active
                ? "Recorrência pausada."
                : "Recorrência reativada.",
            )
          }
        >
          {rule.is_active ? "Pausar" : "Reativar"}
        </Button>
        <Button
          variant={confirming ? "destructive" : "outline"}
          className="h-11"
          disabled={pending}
          onClick={() =>
            confirming
              ? run(() => deleteRecurringRule(rule.id), "Recorrência excluída.")
              : setConfirming(true)
          }
        >
          {confirming ? "Confirmar exclusão" : "Excluir"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Pausar ou excluir remove os lançamentos futuros ainda previstos; os já
        pagos ficam no histórico.
      </p>
    </div>
  );
}
