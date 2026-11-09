import { createClient } from "@/lib/supabase/server";

export async function countUnread() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

/** As 100 mais recentes. */
export async function listNotifications() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, kind, title, body, ref_table, ref_id, due_date, read_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export type Notification = Awaited<
  ReturnType<typeof listNotifications>
>[number];

export async function getNotifyDaysBefore() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("notify_days_before")
    .maybeSingle();
  return data?.notify_days_before ?? 3;
}
