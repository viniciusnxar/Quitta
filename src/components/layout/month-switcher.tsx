"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Mês corrente no fuso do Brasil, para servidor e navegador concordarem.
function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const month = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
  return `${month[0].toUpperCase()}${month.slice(1)} ${y}`;
}

/** Seletor de mês na URL (`?mes=YYYY-MM`). Envolver em <Suspense>. */
export function MonthSwitcher() {
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("mes");
  const month =
    raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : currentMonth();

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
      <span className="font-medium">{monthLabel(month)}</span>
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
