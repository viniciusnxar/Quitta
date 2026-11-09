"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Financing } from "@/features/financings/queries";
import {
  FINANCING_KIND_LABELS,
  SYSTEM_LABELS,
} from "@/features/financings/schema";
import type { TransactionOptions } from "@/features/transactions/actions";
import { formatBRL } from "@/lib/finance/money";
import { FinancingForm } from "./financing-form";
import { FinancingProgress } from "./financing-progress";

export function FinancingsView({
  financings,
  options,
}: {
  financings: Financing[];
  options: TransactionOptions;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Financiamentos</h1>
        <Button className="h-11 gap-2" onClick={() => setCreating(true)}>
          <PlusIcon /> Novo
        </Button>
      </div>

      {financings.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum financiamento. Cadastre imóvel, carro ou empréstimo e o app
          gera todas as parcelas (PRICE, SAC ou sem juros).
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {financings.map((f) => (
            <li key={f.id}>
              <Link
                href={`/financiamentos/${f.id}`}
                className="flex flex-col gap-2 px-3 py-3 hover:bg-accent"
              >
                <span className="flex items-center gap-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{f.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[
                        FINANCING_KIND_LABELS[f.kind],
                        f.institution,
                        SYSTEM_LABELS[f.system].split(" ")[0],
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">
                      Financiado
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatBRL(f.financed_amount)}
                    </span>
                  </span>
                </span>
                <FinancingProgress financing={f} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog
        open={creating}
        onOpenChange={setCreating}
        title="Novo financiamento"
      >
        {creating && (
          <FinancingForm
            financing={null}
            options={options}
            onDone={() => setCreating(false)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}
