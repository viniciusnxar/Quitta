import { ArrowLeftIcon, CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { CardEditButton } from "@/components/cards/card-edit-button";
import { CardLimit } from "@/components/cards/card-limit";
import { PayInvoiceButton } from "@/components/cards/pay-invoice-button";
import { TransactionList } from "@/components/transactions/transaction-list";
import { listAccounts } from "@/features/accounts/queries";
import { INVOICE_STATUS_LABELS, pickInvoice } from "@/features/cards/invoices";
import {
  getCard,
  getCardLimits,
  listInvoices,
  type Invoice,
  type InvoiceStatus,
} from "@/features/cards/queries";
import { listTransactionsOf } from "@/features/transactions/queries";
import { formatDate, isMonth } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  aberta: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  fechada: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  vencida: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  paga: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export default function CardPage(props: PageProps<"/cartoes/[id]">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/cartoes"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 text-sm text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Cartões
      </Link>
      <Suspense fallback={<Skeleton />}>
        <CardDetail {...props} />
      </Suspense>
    </div>
  );
}

async function CardDetail({
  params,
  searchParams,
}: PageProps<"/cartoes/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { fatura } = await searchParams;

  const [card, invoices, accounts, limits] = await Promise.all([
    getCard(id),
    listInvoices(id),
    listAccounts(),
    getCardLimits(),
  ]);
  if (!card) notFound();
  const activeAccounts = accounts
    .filter((a) => !a.archived_at)
    .map(({ id, name }) => ({ id, name }));
  const invoice = pickInvoice(
    invoices,
    typeof fatura === "string" && isMonth(fatura) ? fatura : null,
  );

  return (
    <>
      <header className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: card.color ?? "#a3a3a3" }}
        >
          <CreditCardIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{card.name}</h1>
          <p className="text-xs text-muted-foreground">
            {card.archived_at
              ? "Arquivado"
              : `Fecha dia ${card.closing_day} · vence dia ${card.due_day}`}
          </p>
        </div>
        <CardEditButton card={card} accounts={activeAccounts} />
      </header>

      <section className="flex flex-col gap-2 rounded-lg border p-4">
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Limite</span>
          <span className="font-medium tabular-nums">
            {formatBRL(card.credit_limit)}
          </span>
        </p>
        <CardLimit used={limits.get(card.id) ?? 0} limit={card.credit_limit} />
      </section>

      {!invoice ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma fatura ainda. Lance uma despesa neste cartão e a fatura é
          criada sozinha.
        </p>
      ) : (
        <>
          <nav
            aria-label="Faturas"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          >
            {invoices.map((i) => (
              <Link
                key={i.id}
                href={`/cartoes/${id}?fatura=${i.month}`}
                replace
                scroll={false}
                aria-current={i.id === invoice.id ? "page" : undefined}
                className="flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm capitalize aria-[current=page]:border-foreground aria-[current=page]:bg-accent aria-[current=page]:font-medium"
              >
                {formatDate(`${i.month}-01`, "MMM yy")}
              </Link>
            ))}
          </nav>
          <InvoiceSummary invoice={invoice}>
            {invoice.remaining > 0 && (
              <PayInvoiceButton
                invoiceId={invoice.id}
                remaining={invoice.remaining}
                accounts={activeAccounts}
                defaultAccountId={card.payment_account_id}
              />
            )}
          </InvoiceSummary>
          <TransactionList
            first={await listTransactionsOf("invoice_id", invoice.id)}
            search=""
            emptyText="Fatura sem lançamentos."
          />
        </>
      )}
    </>
  );
}

function InvoiceSummary({
  invoice: i,
  children,
}: {
  invoice: Invoice;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Fecha {formatDate(i.closing_date, "dd/MM")} · vence{" "}
          {formatDate(i.due_date, "dd/MM")}
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_CLASS[i.status],
          )}
        >
          {INVOICE_STATUS_LABELS[i.status]}
        </span>
      </div>
      <p className="text-3xl font-semibold tabular-nums">
        {formatBRL(i.total)}
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Pago</p>
          <p className="font-medium tabular-nums">{formatBRL(i.paid)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Restante</p>
          <p className="font-medium tabular-nums">{formatBRL(i.remaining)}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 animate-pulse rounded-md bg-muted" />
      <div className="h-11 animate-pulse rounded-full bg-muted" />
      <div className="h-36 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
