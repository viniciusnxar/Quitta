import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { InstallmentProgress } from "@/components/installments/installment-progress";
import { TransactionList } from "@/components/transactions/transaction-list";
import { getInstallmentPlan } from "@/features/installments/queries";
import { listTransactionsOf } from "@/features/transactions/queries";
import { formatBRL } from "@/lib/finance/money";

export default function InstallmentPage(
  props: PageProps<"/parcelamentos/[id]">,
) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/parcelamentos"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 text-sm text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Parcelamentos
      </Link>
      <Suspense fallback={<Skeleton />}>
        <PlanDetail {...props} />
      </Suspense>
    </div>
  );
}

async function PlanDetail({ params }: PageProps<"/parcelamentos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [plan, items] = await Promise.all([
    getInstallmentPlan(id),
    listTransactionsOf("installment_plan_id", id),
  ]);
  if (!plan) notFound();

  return (
    <>
      <header>
        <h1 className="text-xl font-semibold">{plan.description}</h1>
        <p className="text-sm text-muted-foreground">
          {[plan.card?.name ?? plan.account?.name, plan.category?.name]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatBRL(plan.total_amount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Parcela</p>
            <p className="text-lg font-semibold tabular-nums">
              {plan.installment_count}× {formatBRL(plan.installment_amount)}
            </p>
          </div>
        </div>
        <InstallmentProgress plan={plan} />
        {plan.notes && (
          <p className="text-sm text-muted-foreground">{plan.notes}</p>
        )}
      </section>

      <h2 className="font-medium">Parcelas</h2>
      <TransactionList
        first={items}
        search=""
        emptyText="Nenhuma parcela encontrada."
      />
    </>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-12 animate-pulse rounded-md bg-muted" />
      <div className="h-36 animate-pulse rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
