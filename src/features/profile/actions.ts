"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  emailSchema,
  passwordSchema,
  profileSchema,
} from "./schema";

type Result = { error?: string; message?: string };

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, claims: data?.claims ?? null };
}

export async function updateProfile(input: {
  full_name: string;
}): Promise<Result> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, claims } = await session();
  if (!claims) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", claims.sub);
  if (error) return { error: "Não foi possível salvar o perfil." };
  revalidatePath("/", "layout");
  return {};
}

/** Recebe a foto já reduzida no navegador e troca a anterior. */
export async function uploadAvatar(formData: FormData): Promise<Result> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Escolha uma imagem." };
  if (!AVATAR_TYPES.includes(file.type))
    return { error: "Use JPG, PNG ou WebP." };
  if (file.size > AVATAR_MAX_BYTES) return { error: "Imagem acima de 1 MB." };

  const { supabase, claims } = await session();
  if (!claims) return { error: "Sessão expirada." };
  const ext = file.type.split("/")[1];
  // Nome novo a cada envio: evita cache da foto antiga na URL pública.
  const path = `${claims.sub}/${Date.now()}.${ext}`;
  const bucket = supabase.storage.from("avatars");
  const { error } = await bucket.upload(path, file, { contentType: file.type });
  if (error) return { error: "Não foi possível enviar a foto." };

  const { data: old } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", claims.sub)
    .maybeSingle();
  const url = bucket.getPublicUrl(path).data.publicUrl;
  const { error: upError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", claims.sub);
  if (upError) {
    await bucket.remove([path]);
    return { error: "Não foi possível salvar a foto." };
  }
  const oldPath = old?.avatar_url?.split("/avatars/")[1];
  if (oldPath) await bucket.remove([oldPath]);
  revalidatePath("/", "layout");
  return {};
}

export async function removeAvatar(): Promise<Result> {
  const { supabase, claims } = await session();
  if (!claims) return { error: "Sessão expirada." };
  const { data: old } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", claims.sub)
    .maybeSingle();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", claims.sub);
  if (error) return { error: "Não foi possível remover a foto." };
  const oldPath = old?.avatar_url?.split("/avatars/")[1];
  if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
  revalidatePath("/", "layout");
  return {};
}

/** O Supabase envia link de confirmação; o e-mail só muda depois do clique. */
export async function changeEmail(input: { email: string }): Promise<Result> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, claims } = await session();
  if (!claims) return { error: "Sessão expirada." };
  if (parsed.data.email.toLowerCase() === claims.email?.toLowerCase())
    return { error: "Este já é o seu e-mail." };
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${process.env.SITE_URL}/auth/callback` },
  );
  if (error)
    return {
      error:
        error.code === "email_exists"
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível alterar o e-mail. Tente de novo.",
    };
  return {
    message:
      "Enviamos um link de confirmação. O e-mail muda depois que você confirmar.",
  };
}

/** Confere a senha atual antes de trocar. */
export async function changePassword(input: {
  current: string;
  password: string;
  confirm: string;
}): Promise<Result> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, claims } = await session();
  if (!claims?.email) return { error: "Sessão expirada." };
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: claims.email,
    password: parsed.data.current,
  });
  if (authError) return { error: "Senha atual incorreta." };
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return {
      error:
        error.code === "weak_password"
          ? "Senha muito fraca. Use uma senha mais forte."
          : "Não foi possível alterar a senha.",
    };
  return { message: "Senha alterada." };
}
