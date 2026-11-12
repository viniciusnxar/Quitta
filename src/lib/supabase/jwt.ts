import { createClient } from "@supabase/supabase-js";
import { importJWK, SignJWT, type JWK } from "jose";
import type { Database } from "./database.types";

let key: ReturnType<typeof importJWK> | undefined;
function jwk() {
  try {
    return JSON.parse(process.env.SUPABASE_JWT_PRIVATE_KEY!) as JWK;
  } catch {
    throw new Error(
      "SUPABASE_JWT_PRIVATE_KEY precisa ser o JSON da chave privada (JWK), não o ID da chave.",
    );
  }
}
/**
 * JWT curto que o Supabase aceita como usuário "authenticated": a chave
 * privada foi importada em Settings > JWT Keys, então auth.uid() = userId.
 */
export async function supabaseToken(userId: string, email: string) {
  key ??= importJWK(jwk(), "ES256");
  return new SignJWT({ role: "authenticated", email })
    .setProtectedHeader({ alg: "ES256", kid: jwk().kid, typ: "JWT" })
    .setSubject(userId)
    .setAudience("authenticated")
    .setIssuer(`${process.env.SUPABASE_URL}/auth/v1`)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(await key);
}

/** Cliente de um usuário específico (RLS vale para ele). */
export function clientFor(user: { id: string; email: string }) {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { accessToken: () => supabaseToken(user.id, user.email) },
  );
}
