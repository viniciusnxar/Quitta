"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMonth } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";

const config = {
  receita: { label: "Receitas", color: "oklch(0.6 0.15 150)" },
  despesa: { label: "Despesas", color: "oklch(0.6 0.2 25)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Receitas x despesas por mês (valores em reais). */
export function EvolutionChart({
  data,
}: {
  data: { month: string; receita: number; despesa: number }[];
}) {
  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-56 w-full"
      role="img"
      aria-label="Gráfico de receitas e despesas dos últimos 12 meses"
    >
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickFormatter={(m: string) => formatMonth(m).slice(0, 3)}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => compact.format(v)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => formatMonth(p[0]?.payload.month)}
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-3">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config].label}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatBRL(Number(value))}
                  </span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="receita" fill="var(--color-receita)" radius={2} />
        <Bar dataKey="despesa" fill="var(--color-despesa)" radius={2} />
      </BarChart>
    </ChartContainer>
  );
}
