import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";
import type { Database } from "./database.types";
import { clientFor } from "./jwt";

export { clientFor };

/** Cliente com a sessão do Better Auth; sem sessão, o RLS não devolve nada. */
export async function createClient() {
  const session = await getSession();
  if (session) return clientFor(session.user);
  return createSupabaseClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
  );
}
