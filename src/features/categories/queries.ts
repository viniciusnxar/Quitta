import { createClient } from "@/lib/supabase/server";

export async function listCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export type Category = Awaited<ReturnType<typeof listCategories>>[number];

export async function listTags() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data;
}

export type Tag = Awaited<ReturnType<typeof listTags>>[number];
