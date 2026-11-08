import { monthBounds } from "@/lib/finance/dates";
import { createClient } from "@/lib/supabase/server";

export async function listAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data;
}

export type Account = Awaited<ReturnType<typeof listAccounts>>[number];

/** Saldos calculados pelo banco (v_account_balances), indexados por conta. */
export async function getBalances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_account_balances")
    .select("id, balance, projected_balance_month_end");
  if (error) throw error;
  return new Map(
    data.map((b) => [
      b.id!,
      {
        balance: b.balance ?? 0,
        projected: b.projected_balance_month_end ?? 0,
      },
    ]),
  );
}

export async function getAccount(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Movimentos da conta no mês (competência), com a descrição da transação. */
export async function listAccountMovements(accountId: string, month: string) {
  const supabase = await createClient();
  const { start, end } = monthBounds(month);
  const { data: movements, error } = await supabase
    .from("v_account_movements")
    .select("transaction_id, type, status, date, delta")
    .eq("account_id", accountId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });
  if (error) throw error;
  if (movements.length === 0) return [];

  // A view não expõe a descrição; busca numa segunda consulta.
  const ids = movements.map((m) => m.transaction_id!);
  const { data: txs, error: txError } = await supabase
    .from("transactions")
    .select("id, description")
    .in("id", ids);
  if (txError) throw txError;
  const description = new Map(txs.map((t) => [t.id, t.description]));

  return movements.map((m) => ({
    id: m.transaction_id!,
    type: m.type!,
    status: m.status!,
    date: m.date!,
    delta: m.delta ?? 0,
    description: description.get(m.transaction_id!) ?? "",
  }));
}

export type AccountMovement = Awaited<
  ReturnType<typeof listAccountMovements>
>[number];
