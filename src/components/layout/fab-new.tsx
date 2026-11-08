"use client";

import {
  ArrowDownIcon,
  ArrowLeftRightIcon,
  ArrowUpIcon,
  LayersIcon,
  RepeatIcon,
} from "lucide-react";
import type { ReactElement } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const OPTIONS = [
  { label: "Despesa", icon: ArrowDownIcon },
  { label: "Receita", icon: ArrowUpIcon },
  { label: "Transferência", icon: ArrowLeftRightIcon },
  { label: "Compra parcelada", icon: LayersIcon },
  { label: "Assinatura", icon: RepeatIcon },
];

// Opções ficam desabilitadas até os formulários existirem (commits 14, 22 e 25).
export function FabNew({ trigger }: { trigger: ReactElement }) {
  return (
    <Drawer>
      <DrawerTrigger render={trigger} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Novo lançamento</DrawerTitle>
        </DrawerHeader>
        <ul className="flex flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {OPTIONS.map(({ label, icon: Icon }) => (
            <li key={label}>
              <button
                type="button"
                disabled
                className="flex h-12 w-full items-center gap-3 rounded-md px-2 text-left text-base disabled:opacity-50"
              >
                <Icon className="size-5" />
                {label}
                <span className="ml-auto text-xs text-muted-foreground">
                  em breve
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
