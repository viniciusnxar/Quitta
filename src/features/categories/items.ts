type Option = {
  id: string;
  name: string;
  kind: string;
  parent_id: string | null;
};

/** Itens de select: principais do tipo, cada uma seguida das subs ("Pai › Sub"). */
export function categoryItems(categories: Option[], kind: string) {
  const items: Record<string, string> = {};
  for (const root of categories.filter(
    (c) => c.kind === kind && !c.parent_id,
  )) {
    items[root.id] = root.name;
    for (const sub of categories.filter((c) => c.parent_id === root.id))
      items[sub.id] = `${root.name} › ${sub.name}`;
  }
  return items;
}
