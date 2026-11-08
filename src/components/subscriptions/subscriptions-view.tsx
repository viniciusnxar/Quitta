"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type {
  PriceChange,
  Subscription,
} from "@/features/subscriptions/queries";
import { CYCLE_LABELS } from "@/features/subscriptions/schema";
import type { TransactionOptions } from "@/features/transactions/actions";
import { formatDate } from "@/lib/finance/dates";
import { formatBRL, fromCents, toCents } from "@/lib/finance/money";
import { ProviderLogo } from "./provider-logo";
import { SubscriptionManage } from "./subscription-manage";
import {
  NewSubscription,
  SubscriptionForm,
  subscriptionToInput,
} from "./subscription-form";

const STATUS_LABELS = { pausada: "Pausada", cancelada: "Cancelada" };

export function SubscriptionsView({
  subscriptions,
  priceChanges,
  options,
}: {
  subscriptions: Subscription[];
  priceChanges: PriceChange[];
  options: TransactionOptions;
}) {
  // undefined = fechado; null = nova.
  const [editing, setEditing] = useState<Subscription | null | undefined>();
  const close = () => setEditing(undefined);
  const active = subscriptions.filter((s) => s.status === "ativa");
  const inactive = subscriptions.filter((s) => s.status !== "ativa");
  const monthly = fromCents(
    active.reduce((sum, s) => sum + toCents(s.monthly_equivalent), 0),
  );
  const yearly = fromCents(
    active.reduce((sum, s) => sum + toCents(s.yearly_equivalent), 0),
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assinaturas</h1>
        <Button className="h-11 gap-2" onClick={() => setEditing(null)}>
          <PlusIcon /> Nova
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Por mês</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatBRL(monthly)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Por ano</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatBRL(yearly)}
          </p>
        </div>
      </section>

      {active.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma assinatura ativa. Cadastre streaming, nuvem, apps... e veja
          quanto custam por mês e por ano.
        </p>
      ) : (
        <SubscriptionList subscriptions={active} onSelect={setEditing} />
      )}

      {inactive.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Pausadas e canceladas ({inactive.length})
          </summary>
          <SubscriptionList subscriptions={inactive} onSelect={setEditing} />
        </details>
      )}

      <ResponsiveDialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && close()}
        title={editing ? "Editar assinatura" : "Nova assinatura"}
      >
        {editing === null && (
          <NewSubscription options={options} onDone={close} />
        )}
        {editing && (
          <div key={editing.id} className="flex flex-col gap-2">
            <SubscriptionForm
              id={editing.id}
              initial={subscriptionToInput(editing)}
              options={options}
              onDone={close}
            />
            <SubscriptionManage
              subscription={editing}
              priceChanges={priceChanges.filter(
                (c) => c.subscription_id === editing.id,
              )}
              onDone={close}
            />
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
}

function SubscriptionList({
  subscriptions,
  onSelect,
}: {
  subscriptions: Subscription[];
  onSelect: (s: Subscription) => void;
}) {
  return (
    <ul className="divide-y rounded-lg border">
      {subscriptions.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
          >
            <ProviderLogo provider={s.provider} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{s.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {s.status === "ativa"
                  ? [
                      CYCLE_LABELS[s.cycle],
                      s.card?.name ?? s.account?.name,
                      s.next_charge &&
                        `próxima ${formatDate(s.next_charge, "dd/MM")}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : STATUS_LABELS[s.status]}
              </span>
            </span>
            <span className="flex flex-col items-end tabular-nums">
              <span className="font-medium">{formatBRL(s.amount)}</span>
              {s.cycle !== "mensal" && (
                <span className="text-xs text-muted-foreground">
                  {formatBRL(s.monthly_equivalent)}/mês
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
