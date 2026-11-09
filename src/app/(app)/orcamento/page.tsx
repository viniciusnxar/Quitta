import { Suspense } from "react";
import { BudgetView, type BudgetLine } from "@/components/budgets/budget-view";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import {
  getCategorySpending,
  getMonthSpending,
  listBudgets,
} from "@/features/budgets/queries";
import { resolveBudget } from "@/features/budgets/resolve";
import { listCategories } from "@/features/categories/queries";
import { currentMonth, isMonth } from "@/lib/finance/dates";
import { toCents } from "@/lib/finance/money";

export default function BudgetPage(props: PageProps<"/orcamento">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Orçamento</h1>
      <Suspense>
        <MonthSwitcher />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <Budget {...props} />
      </Suspense>
    </div>
  );
}

async function Budget({ searchParams }: PageProps<"/orcamento">) {
  const { mes } = await searchParams;
  const month = typeof mes === "string" && isMonth(mes) ? mes : currentMonth();
  const monthStart = `${month}-01`;

  const [categories, budgets, spending] = await Promise.all([
    listCategories(),
    listBudgets(),
    getMonthSpending(month),
  ]);
  const byCategory = await getCategorySpending(month, categories);

  const global: BudgetLine = {
    categoryId: null,
    name: "Gastos do mês",
    color: null,
    committedCents: toCents(spending.committed),
    spentCents: toCents(spending.spent),
    budget: resolveBudget(budgets, null, monthStart),
  };
  const lines: BudgetLine[] = categories
    .filter((c) => c.kind === "despesa" && !c.parent_id && !c.archived_at)
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      committedCents: byCategory.get(c.id) ?? 0,
      budget: resolveBudget(budgets, c.id, monthStart),
    }))
    .sort((a, b) => b.committedCents - a.committedCents);

  return <BudgetView month={month} global={global} categories={lines} />;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-36 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
