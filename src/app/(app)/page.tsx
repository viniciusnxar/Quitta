import { ChevronRightIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CardLimit } from "@/components/cards/card-limit";
import {
  TopCategoriesChart,
  type CategorySlice,
} from "@/components/dashboard/top-categories-chart";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import { ProgressBar } from "@/components/progress-bar";
import { listCategories } from "@/features/categories/queries";
import { getDashboard, type Dashboard } from "@/features/dashboard/queries";
import { currentMonth, formatDate, isMonth } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { PALETTE } from "@/lib/palette";
import { cn } from "@/lib/utils";

export default function Home(props: PageProps<"/">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Suspense>
        <MonthSwitcher />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <Overview {...props} />
      </Suspense>
    </div>
  );
}

async function Overview({ searchParams }: PageProps<"/">) {
  const { mes } = await searchParams;
  const month = typeof mes === "string" && isMonth(mes) ? mes : currentMonth();
  const [d, categories] = await Promise.all([
    getDashboard(month),
    listCategories(),
  ]);
  const colorOf = new Map(categories.map((c) => [c.id, c.color]));
  const slices: CategorySlice[] = d.top_categories.map((c, i) => ({
    key: c.category_id ?? "none",
    name: c.name,
    total: c.total,
    color:
      (c.category_id && colorOf.get(c.category_id)) ||
      PALETTE[i % PALETTE.length],
  }));

  return (
    <>
      <Balance d={d} />
      <div className="grid gap-4 md:grid-cols-2">
        <CashFlow flow={d.cash_flow} />
        <Spending
          s={d.spending}
          month={month}
          installments={d.installments.month_amount}
          subscriptions={d.subscriptions.monthly_total}
        />
        <Cards cards={d.cards} />
        <div className="grid grid-cols-2 gap-4">
          <Tile
            href="/parcelamentos"
            title="Parcelamentos"
            value={formatBRL(d.installments.month_amount)}
            hint={`no mês · ${d.installments.active_count} ativos · falta ${formatBRL(d.installments.remaining_amount)}`}
          />
          <Tile
            href="/assinaturas"
            title="Assinaturas"
            value={formatBRL(d.subscriptions.monthly_total)}
            hint={`por mês · ${d.subscriptions.active_count} ativas`}
          />
        </div>
        <Upcoming items={d.upcoming} />
        <Section title="Top categorias" href="/orcamento">
          {slices.length > 0 ? (
            <TopCategoriesChart slices={slices} />
          ) : (
            <Empty>Nenhuma despesa no mês.</Empty>
          )}
        </Section>
      </div>
    </>
  );
}

function Balance({ d }: { d: Dashboard }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-sm text-muted-foreground">Saldo total</p>
        <p
          className={cn(
            "text-3xl font-semibold tabular-nums",
            d.total_balance < 0 && "text-red-600",
          )}
        >
          {formatBRL(d.total_balance)}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          Previsto no fim do mês: {formatBRL(d.projected_balance)}
        </p>
      </div>
      {d.accounts.length > 0 && (
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {d.accounts.map((a) => (
            <li key={a.id} className="shrink-0 snap-start">
              <Link
                href={`/contas/${a.id}`}
                className="flex w-40 flex-col gap-1 rounded-lg border p-3 hover:bg-accent"
                style={{
                  borderLeftColor: a.color ?? undefined,
                  borderLeftWidth: 4,
                }}
              >
                <span className="truncate text-sm">{a.name}</span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    a.balance < 0 && "text-red-600",
                  )}
                >
                  {formatBRL(a.balance)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CashFlow({ flow: f }: { flow: Dashboard["cash_flow"] }) {
  const max = Math.max(f.income_expected, f.expense_expected, 1);
  const rows = [
    {
      label: "Receitas",
      realized: f.income_realized,
      expected: f.income_expected,
      color: "bg-green-600",
    },
    {
      label: "Despesas",
      realized: f.expense_realized,
      expected: f.expense_expected,
      color: "bg-red-600",
    },
  ];
  const result = f.income_expected - f.expense_expected;
  return (
    <Section title="Fluxo de caixa">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1">
          <div className="flex justify-between gap-2 text-sm">
            <span>{r.label}</span>
            <span className="tabular-nums">
              {formatBRL(r.realized)}{" "}
              <span className="text-muted-foreground">
                / {formatBRL(r.expected)}
              </span>
            </span>
          </div>
          {/* Parte sólida = realizado; clara = previsto. */}
          <div
            className="relative h-2 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div
              className={cn("absolute inset-y-0 left-0 opacity-30", r.color)}
              style={{ width: `${(r.expected / max) * 100}%` }}
            />
            <div
              className={cn("absolute inset-y-0 left-0", r.color)}
              style={{ width: `${(r.realized / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-sm text-muted-foreground">
        Resultado previsto:{" "}
        <span
          className={cn(
            "font-medium tabular-nums",
            result < 0 ? "text-red-600" : "text-green-700 dark:text-green-500",
          )}
        >
          {formatBRL(result)}
        </span>
      </p>
    </Section>
  );
}

function Spending({
  s,
  month,
  installments,
  subscriptions,
}: {
  s: Dashboard["spending"];
  month: string;
  installments: number;
  subscriptions: number;
}) {
  const href = `/orcamento?mes=${month}`;
  if (s.budget == null)
    return (
      <Section title="Restante do mês" href={href}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatBRL(installments + subscriptions)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            fixos no mês
          </span>
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Parcelamentos {formatBRL(installments)} · assinaturas{" "}
          {formatBRL(subscriptions)}
        </p>
        <p className="text-sm text-muted-foreground">
          <Link href={href} className="underline">
            Defina um limite
          </Link>{" "}
          para ver quanto ainda pode gastar.
        </p>
      </Section>
    );
  const pct = s.budget > 0 ? Math.round((s.committed / s.budget) * 100) : 100;
  const left = s.remaining ?? 0;
  return (
    <Section title="Restante do mês" href={href}>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          left < 0 && "text-red-600",
        )}
      >
        {formatBRL(Math.abs(left))}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {left < 0 ? "acima do limite" : `de ${formatBRL(s.budget)}`}
        </span>
      </p>
      <ProgressBar
        pct={pct}
        label="Limite de gastos usado"
        valueText={`${pct}% do limite`}
        className={
          pct < 70 ? "bg-green-600" : pct <= 100 ? "bg-amber-500" : "bg-red-600"
        }
      />
      <p className="text-xs text-muted-foreground tabular-nums">
        Já gasto {formatBRL(s.spent)} · com previstos {formatBRL(s.committed)}
      </p>
    </Section>
  );
}

function Cards({ cards }: { cards: Dashboard["cards"] }) {
  return (
    <Section title="Cartões" href="/cartoes">
      {cards.items.length === 0 ? (
        <Empty>Nenhum cartão.</Empty>
      ) : (
        <>
          <CardLimit used={cards.used} limit={cards.limit} />
          {cards.items.length > 1 && (
            <ul className="flex flex-col gap-2 border-t pt-3">
              {cards.items.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/cartoes/${c.id}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color ?? "#a3a3a3" }}
                      />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatBRL(c.available)} livre
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Section>
  );
}

function Upcoming({ items }: { items: Dashboard["upcoming"] }) {
  return (
    <Section title="Próximos 10 dias" href="/transacoes?status=previsto">
      {items.length === 0 ? (
        <Empty>Nada vencendo.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((u) => (
            <li
              key={`${u.source}:${u.id}`}
              className="flex items-center gap-2 text-sm"
            >
              <ClockIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-label="previsto"
              />
              <span className="w-12 shrink-0 text-muted-foreground tabular-nums">
                {formatDate(u.date, "dd/MM")}
              </span>
              <span className="flex-1 truncate">{u.description}</span>
              <span
                className={cn(
                  "tabular-nums",
                  u.type === "receita"
                    ? "text-green-700 dark:text-green-500"
                    : u.type !== "transferencia" && "text-red-600",
                )}
              >
                {formatBRL(u.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Tile({
  href,
  title,
  value,
  hint,
}: {
  href: string;
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-lg border p-4 hover:bg-accent"
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </Link>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="flex items-center justify-between font-medium">
        {title}
        {href && (
          <Link
            href={href}
            aria-label={`Ver ${title.toLowerCase()}`}
            className="-m-3 flex size-11 items-center justify-center text-muted-foreground"
          >
            <ChevronRightIcon className="size-4" />
          </Link>
        )}
      </h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-24 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
