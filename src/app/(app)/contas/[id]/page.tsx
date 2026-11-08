import { ArrowLeftIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { AccountEditButton } from "@/components/accounts/account-edit-button";
import { AccountIcon } from "@/components/accounts/account-icon";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import {
  getAccount,
  getBalances,
  listAccountMovements,
  type AccountMovement,
} from "@/features/accounts/queries";
import { currentMonth, formatDate, isMonth } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<AccountMovement["type"], string> = {
  receita: "Receita",
  despesa: "Despesa",
  transferencia: "Transferência",
  pagamento_fatura: "Pagamento de fatura",
  aplicacao: "Aplicação",
  resgate: "Resgate",
};

export default function AccountPage(props: PageProps<"/contas/[id]">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/contas"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 text-sm text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Contas
      </Link>
      <Suspense fallback={<Skeleton />}>
        <AccountDetail {...props} />
      </Suspense>
    </div>
  );
}

async function AccountDetail({
  params,
  searchParams,
}: PageProps<"/contas/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { mes } = await searchParams;
  const month = typeof mes === "string" && isMonth(mes) ? mes : currentMonth();

  const [account, balances, movements] = await Promise.all([
    getAccount(id),
    getBalances(),
    listAccountMovements(id, month),
  ]);
  if (!account) notFound();
  const balance = balances.get(id) ?? {
    balance: account.initial_balance,
    projected: account.initial_balance,
  };

  return (
    <>
      <header className="flex items-center gap-3">
        <AccountIcon icon={account.icon} color={account.color} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{account.name}</h1>
          {account.archived_at && (
            <p className="text-xs text-muted-foreground">Arquivada</p>
          )}
        </div>
        <AccountEditButton account={account} />
      </header>

      <section className="grid grid-cols-2 gap-3">
        <BalanceCard label="Saldo atual" value={balance.balance} />
        <BalanceCard
          label="Previsto no fim do mês"
          value={balance.projected}
          muted
        />
      </section>

      <Suspense>
        <MonthSwitcher />
      </Suspense>

      {movements.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum movimento neste mês.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {movements.map((m) => (
            <MovementRow key={`${m.id}-${m.delta}`} movement={m} />
          ))}
        </ul>
      )}
    </>
  );
}

function BalanceCard({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          muted && "text-muted-foreground",
          value < 0 && "text-red-600",
        )}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}

function MovementRow({ movement: m }: { movement: AccountMovement }) {
  const planned = m.status === "previsto";
  return (
    <li
      className={cn(
        "flex min-h-14 items-center gap-3 px-3 py-2",
        planned && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{m.description}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {planned && <ClockIcon className="size-3" aria-label="Previsto" />}
          {formatDate(m.date)} · {TYPE_LABELS[m.type]}
        </p>
      </div>
      <span
        className={cn(
          "font-medium tabular-nums",
          m.delta > 0 ? "text-green-600" : "text-red-600",
        )}
      >
        {m.delta > 0 && "+"}
        {formatBRL(m.delta)}
      </span>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
