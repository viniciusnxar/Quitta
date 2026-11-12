"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loginSchema, signupSchema, type AuthState } from "./schema";

const RATE_LIMIT = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
const AUTH_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este e-mail.",
  PASSWORD_TOO_SHORT: "A senha precisa ter ao menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Senha longa demais.",
};

function authError(e: unknown) {
  if (!(e instanceof APIError)) throw e;
  if (e.statusCode === 429) return RATE_LIMIT;
  const code = e.body?.code;
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

  try {
    await auth.api.signInEmail({
      body: { ...parsed.data, callbackURL: "/" },
      headers: await headers(),
    });
  } catch (e) {
    return { error: authError(e), email };
  }
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
  try {
    const { token } = await auth.api.signUpEmail({
      body: { ...credentials, name: full_name, callbackURL: "/login" },
      headers: await headers(),
    });
    // Sem sessão = confirmação de e-mail obrigatória.
    if (!token)
      return {
        message: "Enviamos um link de confirmação para o seu e-mail.",
        email,
      };
  } catch (e) {
    return { error: authError(e), email };
  }
  redirect("/");
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function loginWithGoogle() {
  const { url } = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/login?erro=google",
    },
    headers: await headers(),
  });
  redirect(url ?? "/login?erro=google");
}
