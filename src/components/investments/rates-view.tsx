"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseRate } from "@/features/financings/schema";
import { resetRate, saveRate } from "@/features/investments/rate-actions";
import { RATE_CODE_LABELS, RATE_CODES } from "@/features/investments/schema";
import { formatDate } from "@/lib/finance/dates";
import type { RateCode } from "@/lib/finance/investments";

type Row = {
  code: RateCode;
  annual_rate: number;
  reference_date: string;
  is_custom: boolean;
};

/** Taxas de referência (% a.a.): edita a própria ou volta para a padrão. */
export function RatesView({ rows }: { rows: Row[] }) {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  return (
    <ul className="divide-y rounded-lg border">
      {RATE_CODES.map((code) => (
        <RateRow key={code} code={code} row={byCode.get(code)} />
      ))}
    </ul>
  );
}

function RateRow({ code, row }: { code: RateCode; row?: Row }) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(
    row ? row.annual_rate.toLocaleString("pt-BR") : "",
  );
  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(ok);
    });

  return (
    <li className="flex flex-col gap-2 px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{RATE_CODE_LABELS[code]}</span>
        <span className="text-xs text-muted-foreground">
          {row
            ? `${row.is_custom ? "sua taxa" : "padrão"} · ${formatDate(row.reference_date)}`
            : "sem taxa"}
        </span>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = parseRate(text);
          if (Number.isNaN(value)) return void toast.error("Informe a taxa.");
          run(() => saveRate(code, value), `${RATE_CODE_LABELS[code]} salvo.`);
        }}
      >
        <label className="relative flex-1">
          <span className="sr-only">{RATE_CODE_LABELS[code]} em % ao ano</span>
          <Input
            inputMode="decimal"
            className="h-11 pr-14 text-base tabular-nums"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            % a.a.
          </span>
        </label>
        <Button type="submit" className="h-11" disabled={pending}>
          Salvar
        </Button>
      </form>
      {row?.is_custom && (
        <Button
          variant="ghost"
          className="h-11 self-start"
          disabled={pending}
          onClick={() =>
            run(() => resetRate(code), "Voltou para a taxa padrão.")
          }
        >
          Usar taxa padrão
        </Button>
      )}
    </li>
  );
}
