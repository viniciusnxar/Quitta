import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { TransactionFilters } from "./filters";

export const PAGE_SIZE = 30;

export const cursorSchema = z.object({ date: z.iso.date(), id: z.uuid() });
export type Cursor = z.infer<typeof cursorSchema>;

// Mesmo formato em toda lista de transações, para reaproveitar TransactionList.
const SELECT = `id, type, status, description, amount, date,
  account:accounts!transactions_account_id_user_id_fkey(name),
  to_account:accounts!transactions_to_account_id_user_id_fkey(name),
  card:credit_cards!transactions_card_id_user_id_fkey(name),
  category:categories!transactions_category_id_user_id_fkey(name, color),
  transaction_tags(tag_id)`;

/** Transações da mais recente para a mais antiga, paginadas por (date, id). */
export async function listTransactions(
  filters: TransactionFilters,
  cursor: Cursor | null,
) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(SELECT)
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);

  // Valores abaixo já passaram pelos parsers de filters.ts / cursorSchema,
  // por isso podem ser interpolados nos filtros do PostgREST.
  const { q, de, ate, conta, cartao, categoria, tag, tipo, status } = filters;
  const groups: string[] = [];
  if (conta)
    groups.push(`or(account_id.eq.${conta},to_account_id.eq.${conta})`);
  if (cursor) {
    const { date, id } = cursorSchema.parse(cursor);
    groups.push(`or(date.lt.${date},and(date.eq.${date},id.lt.${id}))`);
  }
  // Um único parâmetro "or": dois .or() separados não se combinam.
  if (groups.length) query = query.or(`and(${groups.join(",")})`);

  if (q?.trim()) {
    const term = q
      .trim()
      .replace(/[\\%_]/g, "\\$&")
      .replace(/\*/g, "");
    query = query.ilike("description", `%${term}%`);
  }
  if (de) query = query.gte("date", de);
  if (ate) query = query.lte("date", ate);
  if (cartao) query = query.eq("card_id", cartao);
  if (tipo) query = query.eq("type", tipo);
  if (status) query = query.eq("status", status);
  if (tag) {
    query = query
      .eq("transaction_tags.tag_id", tag)
      .not("transaction_tags", "is", null);
  }
  if (categoria) {
    // Categoria principal inclui as subcategorias.
    const { data: subs, error } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", categoria);
    if (error) throw error;
    query = query.in("category_id", [categoria, ...subs.map((s) => s.id)]);
  }

  const { data, error } = await query;
  if (error) throw error;

  const items = data.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    next:
      data.length > PAGE_SIZE && last ? { date: last.date, id: last.id } : null,
  };
}

export type TransactionPage = Awaited<ReturnType<typeof listTransactions>>;
export type TransactionItem = TransactionPage["items"][number];

/** Itens de uma fatura ou parcelas de um parcelamento, sem paginação. */
export async function listTransactionsOf(
  column: "invoice_id" | "installment_plan_id",
  id: string,
): Promise<TransactionPage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(SELECT)
    .eq(column, id)
    .order("date", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return { items: data, next: null };
}
