"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Investment } from "@/features/investments/queries";
import {
  INVESTMENT_KIND_LABELS,
  rateText,
} from "@/features/investments/schema";
import { formatBRL, fromCents, toCents } from "@/lib/finance/money";
import { cn } from "@/lib/utils";
import { InvestmentForm } from "./investment-form";

export function InvestmentsView({
  investments,
  accounts,
}: {
  investments: Investment[];
  accounts: { id: string; name: string }[];
}) {
  const [creating, setCreating] = useState(false);
  const active = investments.filter((i) => i.status === "ativo");
  const closed = investments.filter((i) => i.status !== "ativo");
  const sum = (key: "position" | "net_invested") =>
    fromCents(active.reduce((s, i) => s + toCents(i[key]), 0));

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Investimentos</h1>
        <Button className="h-11 gap-2" onClick={() => setCreating(true)}>
          <PlusIcon /> Novo
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Patrimônio</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatBRL(sum("position"))}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Investido</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatBRL(sum("net_invested"))}
          </p>
        </div>
      </section>

      {active.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum investimento. Cadastre CDB, Tesouro, ações... e registre
          aportes e resgates.
        </p>
      ) : (
        <InvestmentList investments={active} />
      )}

      {closed.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Resgatados ({closed.length})
          </summary>
          <InvestmentList investments={closed} />
        </details>
      )}

      <ResponsiveDialog
        open={creating}
        onOpenChange={setCreating}
        title="Novo investimento"
      >
        {creating && (
          <InvestmentForm
            investment={null}
            accounts={accounts}
            onDone={() => setCreating(false)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}

function InvestmentList({ investments }: { investments: Investment[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {investments.map((i) => (
        <li key={i.id}>
          <Link
            href={`/investimentos/${i.id}`}
            className="flex min-h-16 items-center gap-3 px-3 py-2 hover:bg-accent"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{i.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[INVESTMENT_KIND_LABELS[i.kind], i.institution, rateText(i)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="flex flex-col items-end tabular-nums">
              <span className="font-medium">{formatBRL(i.position)}</span>
              {i.net_earnings !== 0 && (
                <span
                  className={cn(
                    "text-xs",
                    i.net_earnings > 0
                      ? "text-green-700 dark:text-green-500"
                      : "text-red-600",
                  )}
                >
                  {i.net_earnings > 0 ? "+" : ""}
                  {formatBRL(i.net_earnings)}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
