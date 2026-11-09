"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, today } from "@/lib/finance/dates";
import {
  annualRate,
  PERIODS,
  project,
  type ProjectionInput,
  type Rates,
} from "@/lib/finance/investments";
import { formatBRL, fromCents, toCents } from "@/lib/finance/money";

const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** Projeção do saldo atual em abas Mensal / Trimestral / Semestral / Anual. */
export function InvestmentProjection({
  investment,
  position,
  rates,
}: {
  investment: ProjectionInput;
  position: number;
  rates: Rates;
}) {
  if (investment.rate_mode === "variavel")
    return (
      <p className="text-sm text-muted-foreground">
        Renda variável não tem projeção: use “Atualizar saldo” nos movimentos.
      </p>
    );
  const annual = annualRate(investment, rates);
  if (annual === null)
    return (
      <p className="text-sm text-muted-foreground">
        Falta a taxa de referência.{" "}
        <Link href="/investimentos/taxas" className="underline">
          Cadastrar taxas
        </Link>
      </p>
    );
  if (position <= 0)
    return (
      <p className="text-sm text-muted-foreground">
        Lance um aporte para ver a projeção.
      </p>
    );

  const from = today();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Taxa efetiva: <span className="tabular-nums">{pct(annual)} a.a.</span> ·{" "}
        <Link href="/investimentos/taxas" className="underline">
          taxas de referência
        </Link>
      </p>
      <Tabs defaultValue="12">
        <TabsList className="w-full">
          {PERIODS.map((p) => (
            <TabsTrigger
              key={p.months}
              value={String(p.months)}
              className="h-10"
            >
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {PERIODS.map((p) => {
          const r = project(
            investment,
            annual,
            toCents(position),
            p.months,
            from,
          );
          const rows: [string, number, string?][] = [
            ["Rendimento bruto", r.grossCents],
            ...(r.iofCents ? [["IOF", -r.iofCents] as [string, number]] : []),
            [
              r.irRate
                ? `IR (${r.irRate.toLocaleString("pt-BR")}%)`
                : "IR (isento)",
              -r.irCents,
            ],
            ["Rendimento líquido", r.netCents, "font-medium"],
          ];
          return (
            <TabsContent
              key={p.months}
              value={String(p.months)}
              className="pt-2"
            >
              <dl className="flex flex-col gap-1.5 text-sm">
                {rows.map(([label, cents, cls]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className={`tabular-nums ${cls ?? ""}`}>
                      {formatBRL(fromCents(cents))}
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between gap-2 border-t pt-1.5">
                  <dt>Saldo em {formatDate(r.end)}</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatBRL(fromCents(r.finalCents))}
                  </dd>
                </div>
              </dl>
            </TabsContent>
          );
        })}
      </Tabs>
      <p className="text-xs text-muted-foreground">
        Estimativa com as taxas atuais; IR pela tabela regressiva na data de
        cada período. Regras tributárias mudam.
      </p>
    </div>
  );
}
