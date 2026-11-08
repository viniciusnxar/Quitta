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
