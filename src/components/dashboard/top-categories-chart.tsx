"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatBRL } from "@/lib/finance/money";

export type CategorySlice = {
  key: string;
  name: string;
  total: number;
  color: string;
};

/** Donut das maiores categorias de despesa do mês, com legenda em lista. */
export function TopCategoriesChart({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((s, c) => s + c.total, 0);
  return (
    <div className="flex items-center gap-4">
      <ChartContainer
        config={{}}
        className="aspect-square h-32 shrink-0"
        role="img"
        aria-label="Gráfico das maiores categorias de despesa"
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => (
                  <span className="flex w-full justify-between gap-3">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium tabular-nums">
                      {formatBRL(Number(value))}
                    </span>
                  </span>
                )}
              />
            }
          />
          <Pie
            data={slices}
            dataKey="total"
            nameKey="name"
            innerRadius="60%"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {total > 0 ? Math.round((s.total / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
