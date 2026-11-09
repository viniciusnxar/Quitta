import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Cria os dados de exemplo no 1º acesso (a função do banco só cria uma vez,
 * e só se o usuário ainda não tem contas). Falha aqui não impede o login.
 */
export async function seedSampleData(supabase: SupabaseClient<Database>) {
  const { error } = await supabase.rpc("seed_sample_data");
  if (error) console.error("[exemplo]", error.message);
}

export async function hasSampleData() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("sample_records")
    .select("record_id", { count: "exact", head: true });
  return (count ?? 0) > 0;
}
