"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { deleteMovement } from "@/features/investments/actions";
import type { Investment, Movement } from "@/features/investments/queries";
import {
  MOVEMENT_KIND_LABELS,
  MOVEMENT_SIGN,
} from "@/features/investments/schema";
import { formatDate } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";
import { InvestmentForm } from "./investment-form";
import { MovementForm } from "./movement-form";

/** Botões Editar / Movimento e a lista de movimentos. */
export function InvestmentDetail({
  investment,
  movements,
  accounts,
}: {
  investment: Investment;
  movements: Movement[];
  accounts: { id: string; name: string }[];
}) {
  const [dialog, setDialog] = useState<"edit" | "move" | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const close = () => setDialog(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button className="h-11 gap-2" onClick={() => setDialog("move")}>
          <PlusIcon /> Movimento
        </Button>
        <Button
          variant="outline"
          className="h-11 gap-2"
          onClick={() => setDialog("edit")}
        >
          <PencilIcon /> Editar
        </Button>
      </div>

      <h2 className="font-medium">Movimentos</h2>
      {movements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Lance o primeiro aporte para começar a acompanhar.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {movements.map((m) => {
            const sign = m.kind === "atualizacao" ? 0 : MOVEMENT_SIGN[m.kind];
            return (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">
                    {MOVEMENT_KIND_LABELS[m.kind]}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[formatDate(m.date), m.account?.name, m.notes]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span
                  className={cn(
                    "tabular-nums",
                    sign > 0 && "text-green-700 dark:text-green-500",
                    sign < 0 && "text-red-600",
                  )}
                >
                  {sign > 0 ? "+" : sign < 0 ? "−" : ""}
                  {formatBRL(m.amount)}
                </span>
                <Button
                  variant={confirming === m.id ? "destructive" : "ghost"}
                  className="h-11 gap-2"
                  disabled={pending}
                  aria-label="Remover movimento"
                  onClick={() => {
                    // Primeiro toque arma; o segundo remove.
                    if (confirming !== m.id) return setConfirming(m.id);
                    startTransition(async () => {
                      const { error } = await deleteMovement(m.id);
                      setConfirming(null);
                      if (error) toast.error(error);
                      else toast.success("Movimento removido.");
                    });
                  }}
                >
                  <Trash2Icon />
                  {confirming === m.id && "Remover?"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ResponsiveDialog
        open={dialog !== null}
        onOpenChange={(o) => !o && close()}
        title={dialog === "edit" ? "Editar investimento" : "Novo movimento"}
      >
        {dialog === "edit" && (
          <InvestmentForm
            investment={investment}
            accounts={accounts}
            onDone={close}
          />
        )}
        {dialog === "move" && (
          <MovementForm
            investment={investment}
            accounts={accounts}
            onDone={close}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}
