"use client";

import { CreditCardIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Card } from "@/features/cards/queries";
import { CARD_BRANDS } from "@/features/cards/schema";
import { CardForm } from "./card-form";
import { CardLimit } from "./card-limit";

type Account = { id: string; name: string };
type CardWithUsage = Card & { used: number };

export function CardsView({
  cards,
  accounts,
}: {
  cards: CardWithUsage[];
  accounts: Account[];
}) {
  const [creating, setCreating] = useState(false);
  const active = cards.filter((c) => !c.archived_at);
  const archived = cards.filter((c) => c.archived_at);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões</h1>
        <Button className="h-11 gap-2" onClick={() => setCreating(true)}>
          <PlusIcon /> Novo cartão
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum cartão ainda. Cadastre o limite e os dias de fechamento e
          vencimento para as compras caírem na fatura certa.
        </p>
      ) : (
        <CardList cards={active} />
      )}

      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Arquivados ({archived.length})
          </summary>
          <CardList cards={archived} />
        </details>
      )}

      <ResponsiveDialog
        open={creating}
        onOpenChange={setCreating}
        title="Novo cartão"
      >
        {creating && (
          <CardForm
            card={null}
            accounts={accounts}
            onDone={() => setCreating(false)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}

function CardList({ cards }: { cards: CardWithUsage[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {cards.map((card) => (
        <li key={card.id}>
          <Link
            href={`/cartoes/${card.id}`}
            className="flex flex-col gap-3 px-3 py-3 hover:bg-accent"
          >
            <span className="flex items-center gap-3">
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
            </span>
            {!card.archived_at && (
              <CardLimit used={card.used} limit={card.credit_limit} />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
