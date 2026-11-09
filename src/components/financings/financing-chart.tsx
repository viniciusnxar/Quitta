"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { FinancingInstallment } from "@/features/financings/queries";
import { formatBRL } from "@/lib/finance/money";

const config = {
  amortization: { label: "Amortização", color: "oklch(0.6 0.13 160)" },
  interest: { label: "Juros", color: "oklch(0.72 0.16 60)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Composição de cada parcela ao longo do prazo (juros caem, amortização sobe). */
export function FinancingChart({
  installments,
}: {
  installments: FinancingInstallment[];
}) {
  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-56 w-full"
      role="img"
      aria-label="Gráfico de juros e amortização por parcela"
    >
      <AreaChart data={installments} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="number"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
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
              labelFormatter={(_, payload) =>
                `Parcela ${payload[0]?.payload.number}`
              }
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
        {(["amortization", "interest"] as const).map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="step"
            stackId="parcela"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.4}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
