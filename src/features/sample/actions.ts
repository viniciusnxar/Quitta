"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Apaga de uma vez os dados de exemplo (e o que foi lançado nas contas/cartões de exemplo). */
export async function deleteSampleData(): Promise<{
  error?: string;
  count?: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_sample_data");
  if (error) return { error: "Não foi possível apagar os dados de exemplo." };
  revalidatePath("/", "layout");
  return { count: data };
}
