"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { auth, getSession } from "@/lib/auth";
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
  const user = (await getSession())?.user;
  return { supabase, claims: user ? { sub: user.id, email: user.email } : null };
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

/** O Better Auth envia link de confirmação; o e-mail só muda depois do clique. */
export async function changeEmail(input: { email: string }): Promise<Result> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { claims } = await session();
  if (!claims) return { error: "Sessão expirada." };
  if (parsed.data.email.toLowerCase() === claims.email?.toLowerCase())
    return { error: "Este já é o seu e-mail." };
  try {
    // Link vai para o novo e-mail; se ele já tiver conta, nada acontece (sem vazar isso).
    await auth.api.changeEmail({
      body: { newEmail: parsed.data.email, callbackURL: "/" },
      headers: await headers(),
    });
  } catch {
    return { error: "Não foi possível alterar o e-mail. Tente de novo." };
  }
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
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.current,
        newPassword: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch (e) {
    if (!(e instanceof APIError)) throw e;
    if (e.status === "UNAUTHORIZED") return { error: "Sessão expirada." };
    return {
      error:
        e.body?.code === "INVALID_PASSWORD"
          ? "Senha atual incorreta."
          : "Não foi possível alterar a senha.",
    };
  }
  return { message: "Senha alterada." };
}

/** Exclui a conta e todos os dados. Exige digitar o próprio e-mail. */
export async function deleteAccount(input: { email: string }): Promise<Result> {
  const { supabase, claims } = await session();
  if (!claims?.email) return { error: "Sessão expirada." };
  if (input.email.trim().toLowerCase() !== claims.email.toLowerCase())
    return { error: "O e-mail digitado não confere." };

  // Fotos primeiro: o Storage não apaga arquivos em cascata.
  const bucket = supabase.storage.from("avatars");
  const { data: files } = await bucket.list(claims.sub);
  if (files?.length)
    await bucket.remove(files.map((f) => `${claims.sub}/${f.name}`));

  const { error } = await supabase.rpc("delete_my_account");
  if (error)
    return { error: "Não foi possível excluir a conta. Tente de novo." };
  // A sessão já foi apagada em cascata; signOut só limpa os cookies.
  await auth.api.signOut({ headers: await headers() }).catch(() => {});
  redirect("/login?conta=excluida");
}
