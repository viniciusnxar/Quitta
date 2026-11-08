import { createClient } from "@/lib/supabase/server";

export async function listCards() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export type Card = Awaited<ReturnType<typeof listCards>>[number];

export async function getCard(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Faturas do cartão, da mais antiga para a mais nova. */
export async function listInvoices(cardId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_invoices")
    .select(
      "id, reference_month, closing_date, due_date, total, paid, remaining, status",
    )
    .eq("card_id", cardId)
    .order("reference_month");
  if (error) throw error;
  // Colunas de view vêm como opcionais nos tipos; na prática nunca são nulas.
  return data.map((i) => ({
    id: i.id!,
    month: i.reference_month!.slice(0, 7),
    closing_date: i.closing_date!,
    due_date: i.due_date!,
    total: i.total ?? 0,
    paid: i.paid ?? 0,
    remaining: i.remaining ?? 0,
    status: i.status as InvoiceStatus,
  }));
}

export type InvoiceStatus = "aberta" | "fechada" | "vencida" | "paga";
export type Invoice = Awaited<ReturnType<typeof listInvoices>>[number];

/** Limite usado por cartão (o banco soma compras, parcelas futuras, estornos e pagamentos). */
export async function getCardLimits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_card_limits")
    .select("id, used");
  if (error) throw error;
  return new Map(data.map((c) => [c.id!, c.used ?? 0]));
}
