import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Nome, e-mail e foto de quem está logado (null sem sessão). */
export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const { user } = session;
  const supabase = await createClient();
  // "*": não quebra se a coluna avatar_url ainda não existir (migration pendente).
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("[perfil]", error.message);
  return {
    id: user.id,
    email: user.email,
    // Reserva: o nome informado no cadastro fica no usuário do Better Auth.
    full_name: data?.full_name || user.name || "",
    avatar_url: data?.avatar_url ?? null,
  };
}

export type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;
