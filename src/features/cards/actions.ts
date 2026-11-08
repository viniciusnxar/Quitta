"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromCents, toCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import {
  cardSchema,
  payInvoiceSchema,
  type CardInput,
  type PayInvoiceInput,
} from "./schema";

type Result = { error?: string };

export async function saveCard(
  id: string | null,
  input: CardInput,
): Promise<Result> {
  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !z.uuid().safeParse(id).success)
    return { error: "Cartão inválido." };

  const { credit_limit_cents, issuer, last_digits, ...rest } = parsed.data;
  const row = {
    ...rest,
    issuer: issuer || null,
    last_digits: last_digits || null,
    credit_limit: fromCents(credit_limit_cents),
  };

  // user_id vem do default auth.uid(); a FK (payment_account_id, user_id) barra conta de outro usuário.
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("credit_cards").update(row).eq("id", id)
    : await supabase.from("credit_cards").insert(row);
  if (error) return { error: "Não foi possível salvar o cartão." };

  // Cartões aparecem no formulário e nos filtros de transações também.
  revalidatePath("/", "layout");
  return {};
}

export async function setCardArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { error: "Cartão inválido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("credit_cards")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar o cartão." };

  revalidatePath("/", "layout");
  return {};
}

export async function payInvoice(input: PayInvoiceInput): Promise<Result> {
  const parsed = payInvoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { invoice_id, account_id, amount_cents, date } = parsed.data;

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("v_invoices")
    .select("remaining")
    .eq("id", invoice_id)
    .maybeSingle();
  if (!invoice) return { error: "Fatura não encontrada." };
  if (amount_cents > toCents(invoice.remaining ?? 0))
    return { error: "O valor passa do que falta pagar." };

  // A função cria a transação pagamento_fatura (pago) na conta escolhida.
  const { error } = await supabase.rpc("pay_invoice", {
    p_invoice_id: invoice_id,
    p_account_id: account_id,
    p_amount: fromCents(amount_cents),
    p_date: date,
  });
  if (error) return { error: "Não foi possível pagar a fatura." };

  revalidatePath("/", "layout");
  return {};
}
