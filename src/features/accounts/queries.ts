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
