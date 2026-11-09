import { createClient } from "@/lib/supabase/server";

/** Nome, e-mail e foto de quem está logado (null sem sessão). */
export async function getProfile() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims) return null;
  // "*": não quebra se a coluna avatar_url ainda não existir (migration pendente).
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle();
  if (error) console.error("[perfil]", error.message);
  // Reserva: o nome informado no cadastro fica no user_metadata do token.
  const metaName = (claims.user_metadata as { full_name?: string } | undefined)
    ?.full_name;
  return {
    id: claims.sub,
    email: claims.email ?? "",
    full_name: data?.full_name || metaName || "",
    avatar_url: data?.avatar_url ?? null,
  };
}

export type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;
