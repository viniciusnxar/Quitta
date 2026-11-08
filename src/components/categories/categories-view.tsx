"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category, Tag } from "@/features/categories/queries";
import { NATURE_LABELS } from "@/features/categories/schema";
import { cn } from "@/lib/utils";
import { CategoryForm } from "./category-form";
import { TagForm } from "./tag-form";

type Kind = Category["kind"];
type Editing =
  | { type: "category"; kind: Kind; category: Category | null }
  | { type: "tag"; tag: Tag | null };

export function CategoriesView({
  categories,
  tags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const close = () => setEditing(null);

  const title =
    editing?.type === "tag"
      ? editing.tag
        ? "Editar tag"
        : "Nova tag"
      : editing?.category
        ? "Editar categoria"
        : "Nova categoria";

  return (
    <>
      <h1 className="text-2xl font-semibold">Categorias e tags</h1>

      <Tabs defaultValue="despesa">
        <TabsList className="w-full">
          <TabsTrigger value="despesa" className="h-10">
            Despesas
          </TabsTrigger>
          <TabsTrigger value="receita" className="h-10">
            Receitas
          </TabsTrigger>
          <TabsTrigger value="tags" className="h-10">
            Tags
          </TabsTrigger>
        </TabsList>

        {(["despesa", "receita"] as const).map((kind) => (
          <TabsContent
            key={kind}
            value={kind}
            className="flex flex-col gap-4 pt-2"
          >
            <Button
              className="h-11 gap-2 self-end"
              onClick={() =>
                setEditing({ type: "category", kind, category: null })
              }
            >
              <PlusIcon /> Nova categoria
            </Button>
            <CategoryTree
              categories={categories.filter((c) => c.kind === kind)}
              onSelect={(category) =>
                setEditing({ type: "category", kind, category })
              }
            />
          </TabsContent>
        ))}

        <TabsContent value="tags" className="flex flex-col gap-4 pt-2">
          <Button
            className="h-11 gap-2 self-end"
            onClick={() => setEditing({ type: "tag", tag: null })}
          >
            <PlusIcon /> Nova tag
          </Button>
          {tags.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Tags marcam transações de categorias diferentes, como
              &quot;viagem&quot; ou &quot;reforma&quot;.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => setEditing({ type: "tag", tag })}
                    className="flex min-h-11 items-center gap-2 rounded-full border px-4 hover:bg-accent"
                  >
                    <Dot color={tag.color} />
                    {tag.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <ResponsiveDialog
        open={!!editing}
        onOpenChange={(o) => !o && close()}
        title={title}
      >
        {editing?.type === "category" && (
          <CategoryForm
            key={editing.category?.id ?? "new"}
            category={editing.category}
            kind={editing.kind}
            parents={categories.filter(
              (c) => c.kind === editing.kind && !c.parent_id && !c.archived_at,
            )}
            onDone={close}
          />
        )}
        {editing?.type === "tag" && (
          <TagForm
            key={editing.tag?.id ?? "new"}
            tag={editing.tag}
            onDone={close}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}

function CategoryTree({
  categories,
  onSelect,
}: {
  categories: Category[];
  onSelect: (category: Category) => void;
}) {
  const active = categories.filter((c) => !c.archived_at);
  const archived = categories.filter((c) => c.archived_at);
  const activeIds = new Set(active.map((c) => c.id));
  // Sub ativa com pai arquivado aparece como principal, para não sumir.
  const roots = active.filter(
    (c) => !c.parent_id || !activeIds.has(c.parent_id),
  );
  const childrenOf = (id: string) => active.filter((c) => c.parent_id === id);

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {roots.map((root) => (
          <li key={root.id}>
            <CategoryRow category={root} onSelect={onSelect} />
            {childrenOf(root.id).map((child) => (
              <CategoryRow
                key={child.id}
                category={child}
                onSelect={onSelect}
                sub
              />
            ))}
          </li>
        ))}
      </ul>
      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Arquivadas ({archived.length})
          </summary>
          <ul className="divide-y rounded-lg border">
            {archived.map((c) => (
              <li key={c.id}>
                <CategoryRow category={c} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function CategoryRow({
  category,
  onSelect,
  sub,
}: {
  category: Category;
  onSelect: (category: Category) => void;
  sub?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 px-3 text-left hover:bg-accent",
        sub && "pl-10 text-sm",
      )}
    >
      <Dot color={category.color} />
      <span className="flex-1 truncate">{category.name}</span>
      <span className="text-xs text-muted-foreground">
        {NATURE_LABELS[category.nature]}
      </span>
    </button>
  );
}

function Dot({ color }: { color: string | null }) {
  return (
    <span
      className="size-3 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? "#a3a3a3" }}
    />
  );
}
