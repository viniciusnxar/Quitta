import { DownloadIcon } from "lucide-react";
import { Suspense } from "react";
import {
  TopCategoriesChart,
  type CategorySlice,
} from "@/components/dashboard/top-categories-chart";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import { EvolutionChart } from "@/components/reports/evolution-chart";
import { buttonVariants } from "@/components/ui/button";
import { listCategories } from "@/features/categories/queries";
import { NATURE_LABELS } from "@/features/categories/schema";
import {
  byCategory,
  bySource,
  byTag,
  evolution,
  incomeByNature,
  type Slice,
} from "@/features/reports/aggregate";
import {
  getEvolutionRows,
  listMonthTransactions,
  toReportTx,
} from "@/features/reports/queries";
import { currentMonth, isMonth } from "@/lib/finance/dates";
import { formatBRL, fromCents } from "@/lib/finance/money";
import { PALETTE } from "@/lib/palette";

export default function ReportsPage(props: PageProps<"/relatorios">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Relatórios</h1>
      <Suspense>
        <MonthSwitcher />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <Reports {...props} />
      </Suspense>
    </div>
  );
}

async function Reports({ searchParams }: PageProps<"/relatorios">) {
  const { mes } = await searchParams;
  const month = typeof mes === "string" && isMonth(mes) ? mes : currentMonth();
  const [txs, categories, evo] = await Promise.all([
    listMonthTransactions(month),
    listCategories(),
    getEvolutionRows(month),
  ]);
  const report = txs.map(toReportTx);
  const groups = byCategory(report, categories);
  const slices: CategorySlice[] = groups.slice(0, 8).map((g, i) => ({
    key: g.key,
    name: g.name,
    total: fromCents(g.cents),
    color: g.color ?? PALETTE[i % PALETTE.length],
  }));
  const months = evolution(evo.rows, evo.months).map((m) => ({
    month: m.month,
    receita: fromCents(m.receita),
    despesa: fromCents(m.despesa),
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(["xlsx", "csv"] as const).map((f) => (
          <a
            key={f}
            href={`/relatorios/exportar?formato=${f}&mes=${month}`}
            download
            className={buttonVariants({
              variant: f === "xlsx" ? "default" : "outline",
              className: "h-11 gap-2",
            })}
          >
            <DownloadIcon /> {f === "xlsx" ? "Excel (.xlsx)" : "CSV"}
          </a>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Receitas x despesas (12 meses)" wide>
          <EvolutionChart data={months} />
        </Section>

        <Section title="Despesas por categoria">
          {groups.length === 0 ? (
            <Empty />
          ) : (
            <>
              <TopCategoriesChart slices={slices} />
              <ul className="flex flex-col gap-2 border-t pt-3 text-sm">
                {groups.map((g) => (
                  <li key={g.key}>
                    <Line name={g.name} cents={g.cents} bold />
                    {g.children.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-1 pl-4 text-muted-foreground">
                        {g.children.map((c) => (
                          <li key={c.key}>
                            <Line name={c.name} cents={c.cents} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        <BarList title="Despesas por conta e cartão" items={bySource(report)} />
        <BarList title="Despesas por tag" items={byTag(report)} />
        <BarList
          title="Receitas por natureza"
          items={incomeByNature(report, categories, NATURE_LABELS)}
          color="bg-green-600"
        />
      </div>
    </>
  );
}

function BarList({
  title,
  items,
  color = "bg-primary",
}: {
  title: string;
  items: Slice[];
  color?: string;
}) {
  const max = Math.max(...items.map((i) => i.cents), 1);
  return (
    <Section title={title}>
      {items.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-2.5 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex flex-col gap-1">
              <Line name={i.name} cents={i.cents} />
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${(i.cents / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Line({
  name,
  cents,
  bold,
}: {
  name: string;
  cents: number;
  bold?: boolean;
}) {
  return (
    <span className="flex justify-between gap-2">
      <span className={`truncate ${bold ? "font-medium" : ""}`}>{name}</span>
      <span className="tabular-nums">{formatBRL(fromCents(cents))}</span>
    </span>
  );
}

function Section({
  title,
  wide,
  children,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border p-4 ${wide ? "md:col-span-2" : ""}`}
    >
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Nada neste mês.</p>;
}

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
      <div className="h-64 animate-pulse rounded-lg bg-muted md:col-span-2" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
