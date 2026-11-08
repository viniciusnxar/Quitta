import Link from "next/link";
import { Suspense } from "react";
import { InstallmentProgress } from "@/components/installments/installment-progress";
import {
  listInstallmentPlans,
  type InstallmentPlan,
} from "@/features/installments/queries";
import { formatBRL } from "@/lib/finance/money";

export default function InstallmentsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Parcelamentos</h1>
      <Suspense fallback={<Skeleton />}>
        <Plans />
      </Suspense>
    </div>
  );
}

async function Plans() {
  const plans = await listInstallmentPlans();
  const active = plans.filter((p) => p.is_active);
  const done = plans.filter((p) => !p.is_active);

  if (plans.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nenhum parcelamento ainda. Use o + e escolha &quot;Compra
        parcelada&quot;.
      </p>
    );
  }

  return (
    <>
      {active.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {active.length} em andamento · falta{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatBRL(active.reduce((s, p) => s + p.remaining_amount, 0))}
          </span>
        </p>
      )}
      <PlanList plans={active} />
      {done.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Quitados ({done.length})
          </summary>
          <PlanList plans={done} />
        </details>
      )}
    </>
  );
}

function PlanList({ plans }: { plans: InstallmentPlan[] }) {
  if (plans.length === 0) return null;
  return (
    <ul className="divide-y rounded-lg border">
      {plans.map((p) => (
        <li key={p.id}>
          <Link
            href={`/parcelamentos/${p.id}`}
            className="flex flex-col gap-2 px-3 py-3 hover:bg-accent"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {p.description}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[p.card?.name ?? p.account?.name, p.category?.name]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {p.installment_count}× {formatBRL(p.installment_amount)}
              </span>
            </span>
            <InstallmentProgress plan={p} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
