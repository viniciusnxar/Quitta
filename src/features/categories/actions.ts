"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  categorySchema,
  tagSchema,
  type CategoryInput,
  type TagInput,
} from "./schema";

type Result = { error?: string };

const DUPLICATE = "23505";

export async function saveCategory(
  id: string | null,
  input: CategoryInput,
): Promise<Result> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { kind, parent_id, ...fields } = parsed.data;
  const supabase = await createClient();

  // Só um nível: o pai precisa ser categoria principal do mesmo tipo.
  if (parent_id) {
    if (parent_id === id) return { error: "Escolha outra categoria pai." };
    const { data: parent } = await supabase
      .from("categories")
      .select("kind, parent_id")
      .eq("id", parent_id)
      .maybeSingle();
    if (!parent || parent.parent_id || parent.kind !== kind)
      return { error: "Categoria pai inválida." };
    if (id) {
      const { count } = await supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", id);
      if (count)
        return {
          error: "Esta categoria tem subcategorias e não pode virar uma.",
        };
    }
  }

  // O tipo (receita/despesa) não muda depois de criado.
  const { error } = id
    ? await supabase
        .from("categories")
        .update({ ...fields, parent_id })
        .eq("id", id)
    : await supabase.from("categories").insert({ ...fields, kind, parent_id });
  if (error)
    return {
      error:
        error.code === DUPLICATE
          ? "Já existe uma categoria com esse nome aqui."
          : "Não foi possível salvar a categoria.",
    };

  revalidatePath("/categorias");
  return {};
}

export async function setCategoryArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  // id vai interpolado no filtro .or(): precisa ser uuid de verdade.
  if (!z.uuid().safeParse(id).success) return { error: "Categoria inválida." };
  const supabase = await createClient();
  const archived_at = archived ? new Date().toISOString() : null;
  // Arquivar a principal arquiva as subcategorias junto.
  const { error } = await supabase
    .from("categories")
    .update({ archived_at })
    .or(`id.eq.${id},parent_id.eq.${id}`);
  if (error) return { error: "Não foi possível atualizar a categoria." };

  revalidatePath("/categorias");
  return {};
}

export async function saveTag(
  id: string | null,
  input: TagInput,
): Promise<Result> {
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("tags").update(parsed.data).eq("id", id)
    : await supabase.from("tags").insert(parsed.data);
  if (error)
    return {
      error:
        error.code === DUPLICATE
          ? "Já existe uma tag com esse nome."
          : "Não foi possível salvar a tag.",
    };

  revalidatePath("/categorias");
  return {};
}

/** Remove a tag; os vínculos com transações saem junto (cascade). */
export async function deleteTag(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a tag." };

  revalidatePath("/categorias");
  return {};
}
