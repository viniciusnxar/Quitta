"use client";

import { CreditCardIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Card } from "@/features/cards/queries";
import { CARD_BRANDS } from "@/features/cards/schema";
import { formatBRL } from "@/lib/finance/money";
import { CardForm } from "./card-form";

type Account = { id: string; name: string };

export function CardsView({
  cards,
  accounts,
}: {
  cards: Card[];
  accounts: Account[];
}) {
  // undefined = fechado, null = novo cartão.
  const [editing, setEditing] = useState<Card | null | undefined>(undefined);
  const active = cards.filter((c) => !c.archived_at);
  const archived = cards.filter((c) => c.archived_at);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões</h1>
        <Button className="h-11 gap-2" onClick={() => setEditing(null)}>
          <PlusIcon /> Novo cartão
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum cartão ainda. Cadastre o limite e os dias de fechamento e
          vencimento para as compras caírem na fatura certa.
        </p>
      ) : (
        <CardList cards={active} onSelect={setEditing} />
      )}

      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Arquivados ({archived.length})
          </summary>
          <CardList cards={archived} onSelect={setEditing} />
        </details>
      )}

      <ResponsiveDialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
        title={editing ? "Editar cartão" : "Novo cartão"}
      >
        {editing !== undefined && (
          <CardForm
            key={editing?.id ?? "new"}
            card={editing}
            accounts={accounts}
            onDone={() => setEditing(undefined)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}

function CardList({
  cards,
  onSelect,
}: {
  cards: Card[];
  onSelect: (card: Card) => void;
}) {
  return (
    <ul className="divide-y rounded-lg border">
      {cards.map((card) => (
        <li key={card.id}>
          <button
            type="button"
            onClick={() => onSelect(card)}
            className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: card.color ?? "#a3a3a3" }}
            >
              <CreditCardIcon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">
                {card.name}
                {card.last_digits && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    •••• {card.last_digits}
                  </span>
                )}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {[
                  card.brand &&
                    CARD_BRANDS[card.brand as keyof typeof CARD_BRANDS],
                  `fecha dia ${card.closing_day}`,
                  `vence dia ${card.due_day}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Limite</span>
              <span className="font-medium tabular-nums">
                {formatBRL(card.credit_limit)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
