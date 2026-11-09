import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { InvestmentDetail } from "@/components/investments/investment-detail";
import { listAccounts } from "@/features/accounts/queries";
import { getInvestment, listMovements } from "@/features/investments/queries";
import {
  INVESTMENT_KIND_LABELS,
  LIQUIDITY_LABELS,
  rateText,
} from "@/features/investments/schema";
import { formatDate } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export default function InvestmentPage(
  props: PageProps<"/investimentos/[id]">,
) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/investimentos"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 text-sm text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Investimentos
      </Link>
      <Suspense fallback={<Skeleton />}>
        <Detail {...props} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: PageProps<"/investimentos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [inv, movements, accounts] = await Promise.all([
    getInvestment(id),
    listMovements(id),
    listAccounts(),
  ]);
  if (!inv) notFound();

  return (
    <>
      <header>
        <h1 className="text-xl font-semibold">{inv.name}</h1>
        <p className="text-sm text-muted-foreground">
          {[
            INVESTMENT_KIND_LABELS[inv.kind],
            inv.institution,
            rateText(inv),
            inv.tax_exempt && "isento de IR",
            inv.status === "resgatado" && "resgatado",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
        <div>
          <p className="text-muted-foreground">Saldo</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatBRL(inv.position)}
          </p>
          {inv.current_value_at && (
            <p className="text-xs text-muted-foreground">
              atualizado em {formatDate(inv.current_value_at)}
            </p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground">Rendimento</p>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums",
              inv.net_earnings < 0 && "text-red-600",
            )}
          >
            {formatBRL(inv.net_earnings)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Investido</p>
          <p className="font-medium tabular-nums">
            {formatBRL(inv.net_invested)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Liquidez</p>
          <p className="font-medium">
            {inv.liquidity === "d_mais_n"
              ? `D+${inv.liquidity_days}`
              : LIQUIDITY_LABELS[inv.liquidity]}
            {inv.maturity_date && ` · vence ${formatDate(inv.maturity_date)}`}
          </p>
        </div>
      </section>

      <InvestmentDetail
        investment={inv}
        movements={movements}
        accounts={accounts.filter((a) => !a.archived_at)}
      />
    </>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-12 animate-pulse rounded-md bg-muted" />
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
