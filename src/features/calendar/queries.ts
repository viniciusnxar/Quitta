import { monthBounds } from "@/lib/finance/dates";
import { createClient } from "@/lib/supabase/server";

export type CalendarEventType =
  "receita" | "despesa" | "transferencia" | "pagamento_fatura" | "fechamento";

/** Transações, vencimentos e fechamentos de fatura do mês ("YYYY-MM"). */
export async function getCalendar(month: string) {
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_calendar", {
    p_from: start,
    p_to: end,
  });
  if (error) throw error;
  return data.map((e) => ({
    date: e.event_date,
    source: e.source as "transacao" | "fatura" | "fechamento",
    id: e.ref_id,
    title: e.title,
    amount: e.amount,
    type: e.type as CalendarEventType,
    status: e.status,
    cardId: e.card_id as string | null,
  }));
}

export type CalendarEvent = Awaited<ReturnType<typeof getCalendar>>[number];
