"use client";

import {
  ArrowDownIcon,
  ArrowLeftRightIcon,
  ArrowUpIcon,
  LayersIcon,
  RepeatIcon,
} from "lucide-react";
import { Suspense, use, useState, type ReactElement } from "react";
import { InstallmentForm } from "@/components/installments/installment-form";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  loadTransactionOptions,
  type TransactionOptions,
} from "@/features/transactions/actions";
import type { FormType } from "@/features/transactions/schema";

type FabType = FormType | "parcelado";

const OPTIONS: {
  label: string;
  icon: typeof ArrowDownIcon;
  type?: FabType;
}[] = [
  { label: "Despesa", icon: ArrowDownIcon, type: "despesa" },
  { label: "Receita", icon: ArrowUpIcon, type: "receita" },
  { label: "Transferência", icon: ArrowLeftRightIcon, type: "transferencia" },
  { label: "Compra parcelada", icon: LayersIcon, type: "parcelado" },
  // Sem tipo = ainda não existe (commit 25).
  { label: "Assinatura", icon: RepeatIcon },
];

type Opening = { type: FabType; options: Promise<TransactionOptions | null> };

export function FabNew({ trigger }: { trigger: ReactElement }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [opening, setOpening] = useState<Opening | null>(null);
  const close = () => setOpening(null);

  return (
    <>
      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerTrigger render={trigger} />
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Novo lançamento</DrawerTitle>
          </DrawerHeader>
          <ul className="flex flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {OPTIONS.map(({ label, icon: Icon, type }) => (
              <li key={label}>
                <button
                  type="button"
                  disabled={!type}
                  onClick={() => {
                    if (!type) return;
                    setMenuOpen(false);
                    setOpening({
                      type,
                      options: loadTransactionOptions().catch(() => null),
                    });
                  }}
                  className="flex h-12 w-full items-center gap-3 rounded-md px-2 text-left text-base hover:bg-accent disabled:opacity-50"
                >
                  <Icon className="size-5" />
                  {label}
                  {!type && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      em breve
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>

      <ResponsiveDialog
        open={!!opening}
        onOpenChange={(o) => !o && close()}
        title={
          opening?.type === "parcelado" ? "Compra parcelada" : "Novo lançamento"
        }
      >
        {opening && (
          <Suspense
            fallback={
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
            }
          >
            <LoadedForm opening={opening} onDone={close} />
          </Suspense>
        )}
      </ResponsiveDialog>
    </>
  );
}

function LoadedForm({
  opening,
  onDone,
}: {
  opening: Opening;
  onDone: () => void;
}) {
  const options = use(opening.options);
  if (!options)
    return (
      <p className="pb-4 text-center text-muted-foreground">
        Não foi possível carregar suas contas. Tente de novo.
      </p>
    );
  return opening.type === "parcelado" ? (
    <InstallmentForm options={options} onDone={onDone} />
  ) : (
    <TransactionForm type={opening.type} options={options} onDone={onDone} />
  );
}
