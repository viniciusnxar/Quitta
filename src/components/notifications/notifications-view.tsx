"use client";

import {
  CalendarClockIcon,
  CreditCardIcon,
  HomeIcon,
  type LucideIcon,
  RepeatIcon,
  TriangleAlertIcon,
  BellIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  markAllRead,
  markRead,
  setNotifyDaysBefore,
} from "@/features/notifications/actions";
import type { Notification } from "@/features/notifications/queries";
import { formatDate, today } from "@/lib/finance/dates";
import { cn } from "@/lib/utils";

const ICONS: Partial<Record<Notification["kind"], LucideIcon>> = {
  fatura_fechando: CreditCardIcon,
  fatura_vencendo: CreditCardIcon,
  limite_cartao: TriangleAlertIcon,
  assinatura_renovando: RepeatIcon,
  parcela_financiamento: HomeIcon,
  conta_vencendo: CalendarClockIcon,
  orcamento_excedido: TriangleAlertIcon,
};

/** Para onde a mensagem leva. */
function hrefOf(n: Notification) {
  if (n.ref_table === "credit_cards" && n.ref_id) return `/cartoes/${n.ref_id}`;
  if (n.ref_table === "card_invoices") return "/cartoes";
  if (n.kind === "parcela_financiamento") return "/financiamentos";
  if (n.kind === "assinatura_renovando") return "/assinaturas";
  if (n.ref_table === "transactions") return "/calendario";
  return null;
}

const dayItems = (current: number): Record<string, string> =>
  Object.fromEntries(
    [...new Set([0, 1, 2, 3, 5, 7, 10, 15, current])]
      .sort((a, b) => a - b)
      .map((d) => [
        String(d),
        d === 0 ? "No dia" : `${d} dia${d > 1 ? "s" : ""} antes`,
      ]),
  );

export function NotificationsView({
  notifications,
  daysBefore,
}: {
  notifications: Notification[];
  daysBefore: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read_at).length;
  const DAY_ITEMS = dayItems(daysBefore);
  const run = (fn: () => Promise<{ error?: string }>, ok?: string) =>
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else if (ok) toast.success(ok);
    });

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mensagens</h1>
        {unread > 0 && (
          <Button
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={() => run(markAllRead, "Tudo marcado como lido.")}
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma mensagem. Os avisos de faturas, contas e limite do cartão
          aparecem aqui.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {notifications.map((n) => {
            const Icon = ICONS[n.kind] ?? BellIcon;
            const href = hrefOf(n);
            const overdue = n.due_date && n.due_date < today();
            return (
              <li key={n.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      if (!n.read_at) await markRead(n.id);
                      if (href) router.push(href);
                    })
                  }
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-accent",
                    n.read_at && "text-muted-foreground",
                  )}
                >
                  <Icon className="mt-0.5 size-5 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn(!n.read_at && "font-medium")}>
                      {n.title}
                    </span>
                    {n.body && <span className="text-sm">{n.body}</span>}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(today(new Date(n.created_at)))}
                      {overdue && " · já venceu"}
                    </span>
                  </span>
                  {!n.read_at && (
                    <span
                      className="mt-2 size-2 shrink-0 rounded-full bg-red-600"
                      aria-label="não lida"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section className="flex flex-col gap-2 rounded-lg border p-4">
        <h2 className="font-medium">Avisar com antecedência</h2>
        <Select
          items={DAY_ITEMS}
          value={String(daysBefore)}
          onValueChange={(v) =>
            v &&
            run(() => setNotifyDaysBefore(Number(v)), "Antecedência salva.")
          }
        >
          <SelectTrigger
            className="h-11 w-full"
            aria-label="Antecedência dos avisos"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DAY_ITEMS).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Os avisos são gerados uma vez por dia pelo banco.{" "}
          <Link
            href="https://supabase.com/docs/guides/cron"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            O pg_cron precisa estar ativo
          </Link>{" "}
          (veja o README).
        </p>
      </section>
    </>
  );
}
