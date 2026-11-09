"use server";

import { redirect } from "next/navigation";
import { seedSampleData } from "@/features/sample/queries";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, type AuthState } from "./schema";

const RATE_LIMIT = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  weak_password: "Senha muito fraca. Use uma senha mais forte.",
  over_email_send_rate_limit: RATE_LIMIT,
  over_request_rate_limit: RATE_LIMIT,
};

function authError(code: string | undefined) {
  return (
    (code && AUTH_ERRORS[code]) || "Não foi possível concluir. Tente de novo."
  );
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authError(error.code), email };

  await seedSampleData(supabase);
  redirect("/");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const { full_name, ...credentials } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      data: { full_name },
      emailRedirectTo: `${process.env.SITE_URL}/auth/callback`,
    },
  });
  if (error) return { error: authError(error.code), email };

  // Sem sessão = confirmação de e-mail ativada no projeto.
  if (!data.session) {
    return {
      message: "Enviamos um link de confirmação para o seu e-mail.",
      email,
    };
  }
  await seedSampleData(supabase);
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
