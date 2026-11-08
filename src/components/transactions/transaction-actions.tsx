"use client";

import {
  CheckCircle2Icon,
  ClockIcon,
  CopyIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
  deleteTransaction,
  duplicateTransaction,
  setTransactionPaid,
} from "@/features/transactions/actions";
import type { TransactionItem } from "@/features/transactions/queries";
import { formatDate } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

const DUPLICABLE = ["receita", "despesa", "transferencia"];

export function TransactionActions({
  transaction: t,
  onClose,
}: {
  transaction: TransactionItem | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => {
    setConfirmDelete(false);
    onClose();
  };

  const run = (action: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await action();
      if (error) return void toast.error(error);
      toast.success(ok);
      close();
    });

  return (
    <ResponsiveDialog
      open={!!t}
      onOpenChange={(o) => !o && close()}
      title={t?.description ?? ""}
    >
      {t && (
        <div className="flex flex-col gap-1 pb-2">
          <p className="pb-2 text-sm text-muted-foreground">
            {formatDate(t.date)} · {formatBRL(t.amount)}
          </p>
          {t.status === "pago" ? (
            <Action
              icon={ClockIcon}
              label="Marcar como previsto"
              disabled={pending}
              onClick={() =>
                run(
                  () => setTransactionPaid(t.id, false),
                  "Marcada como prevista.",
                )
              }
            />
          ) : (
            <Action
              icon={CheckCircle2Icon}
              label="Marcar como pago"
              disabled={pending}
              onClick={() =>
                run(() => setTransactionPaid(t.id, true), "Marcada como paga.")
              }
            />
          )}
          {DUPLICABLE.includes(t.type) && (
            <Action
              icon={CopyIcon}
              label="Duplicar para hoje"
              disabled={pending}
              onClick={() =>
                run(() => duplicateTransaction(t.id), "Transação duplicada.")
              }
            />
          )}
          <Action
            icon={Trash2Icon}
            label={confirmDelete ? "Toque de novo para excluir" : "Excluir"}
            destructive
            disabled={pending}
            onClick={() =>
              confirmDelete
                ? run(() => deleteTransaction(t.id), "Transação excluída.")
                : setConfirmDelete(true)
            }
          />
        </div>
      )}
    </ResponsiveDialog>
  );
}

function Action({
  icon: Icon,
  label,
  destructive,
  ...props
}: {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-12 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-accent disabled:opacity-50",
        destructive && "text-destructive",
      )}
      {...props}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
