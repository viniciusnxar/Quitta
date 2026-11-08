"use client";

import {
  PauseIcon,
  PlayIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setSubscriptionStatus } from "@/features/subscriptions/actions";
import type {
  PriceChange,
  Subscription,
} from "@/features/subscriptions/queries";
import { formatDate, today } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

/** Pausar / cancelar / reativar e histórico de preços (no diálogo de edição). */
export function SubscriptionManage({
  subscription: s,
  priceChanges,
  onDone,
}: {
  subscription: Subscription;
  priceChanges: PriceChange[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const run = (status: "ativa" | "pausada" | "cancelada", ok: string) =>
    startTransition(async () => {
      const { error } = await setSubscriptionStatus(s.id, status);
      if (error) return void toast.error(error);
      toast.success(ok);
      onDone();
    });

  return (
    <div className="flex flex-col gap-4 border-t pt-4 pb-2">
      <div className="flex flex-col gap-1">
        {s.status === "ativa" ? (
          <>
            <Action
              icon={PauseIcon}
              label="Pausar"
              hint="Para de gerar cobranças; dá para reativar depois."
              disabled={pending}
              onClick={() => run("pausada", "Assinatura pausada.")}
            />
            <Action
              icon={XCircleIcon}
              label={confirmCancel ? "Toque de novo para cancelar" : "Cancelar"}
              hint={`Encerra em ${formatDate(today())}; cobranças futuras previstas são removidas.`}
              destructive
              disabled={pending}
              onClick={() =>
                confirmCancel
                  ? run("cancelada", "Assinatura cancelada.")
                  : setConfirmCancel(true)
              }
            />
          </>
        ) : (
          <Action
            icon={PlayIcon}
            label="Reativar"
            hint="Volta a gerar cobranças a partir de hoje."
            disabled={pending}
            onClick={() => run("ativa", "Assinatura reativada.")}
          />
        )}
      </div>

      <section aria-labelledby="price-history">
        <h3 id="price-history" className="mb-2 text-sm font-medium">
          Histórico de preços
        </h3>
        {priceChanges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem mudanças de preço. Ao editar o valor, a mudança fica registrada
            aqui.
          </p>
        ) : (
          <ol className="divide-y rounded-lg border text-sm">
            {priceChanges.map((c) => {
              const up = c.new_amount > c.old_amount;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="text-muted-foreground">
                    {formatDate(today(new Date(c.changed_at)))}
                  </span>
                  <span className="tabular-nums">
                    {formatBRL(c.old_amount)} →{" "}
                    <span
                      className={cn(
                        "font-medium",
                        up ? "text-red-600" : "text-green-600",
                      )}
                    >
                      {formatBRL(c.new_amount)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  hint,
  destructive,
  ...props
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-md px-2 py-1 text-left hover:bg-accent disabled:opacity-50",
        destructive && "text-destructive",
      )}
      {...props}
    >
      <Icon className="size-5 shrink-0" />
      <span className="flex flex-col">
        <span className="text-base">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
