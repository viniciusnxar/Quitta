"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  currentMonth,
  formatMonth,
  isMonth,
  shiftMonth,
} from "@/lib/finance/dates";

/** Seletor de mês na URL (`?mes=YYYY-MM`). Envolver em <Suspense>. */
export function MonthSwitcher() {
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("mes");
  const month = isMonth(raw) ? raw : currentMonth();

  const href = (delta: number) => {
    const next = new URLSearchParams(params);
    next.set("mes", shiftMonth(month, delta));
    return `${pathname}?${next}`;
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={href(-1)}
        aria-label="Mês anterior"
        className="flex size-11 items-center justify-center rounded-md hover:bg-accent"
      >
        <ChevronLeftIcon className="size-5" />
      </Link>
      <span className="font-medium">{formatMonth(month)}</span>
      <Link
        href={href(1)}
        aria-label="Próximo mês"
        className="flex size-11 items-center justify-center rounded-md hover:bg-accent"
      >
        <ChevronRightIcon className="size-5" />
      </Link>
    </div>
  );
}
