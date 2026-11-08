import { createClient } from "@/lib/supabase/server";

export async function listFinancings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financings")
    .select("*, financing_installments(count)")
    .order("created_at");
  if (error) throw error;
  return data.map(({ financing_installments, ...f }) => ({
    ...f,
    installments: financing_installments[0]?.count ?? 0,
  }));
}

export type Financing = Awaited<ReturnType<typeof listFinancings>>[number];
