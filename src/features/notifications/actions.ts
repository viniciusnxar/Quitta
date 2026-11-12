"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markRead(id: string): Promise<{ error?: string }> {
  if (!z.uuid().safeParse(id).success) return { error: "Mensagem inválida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) return { error: "Não foi possível marcar como lida." };
  revalidatePath("/", "layout");
  return {};
}

export async function markAllRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) return { error: "Não foi possível marcar como lidas." };
  revalidatePath("/", "layout");
  return {};
}

/** Antecedência dos avisos (dias antes do vencimento). */
export async function setNotifyDaysBefore(
  days: number,
): Promise<{ error?: string }> {
  const parsed = z.number().int().min(0).max(30).safeParse(days);
  if (!parsed.success) return { error: "Use de 0 a 30 dias." };
  const supabase = await createClient();
  const userId = (await getSession())?.user.id;
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("profiles")
    .update({ notify_days_before: parsed.data })
    .eq("id", userId);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/mensagens");
  return {};
}
