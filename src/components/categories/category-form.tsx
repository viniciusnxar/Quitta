"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ColorPicker } from "@/components/color-picker";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveCategory,
  setCategoryArchived,
} from "@/features/categories/actions";
import type { Category } from "@/features/categories/queries";
import {
  NATURE_LABELS,
  NATURES_BY_KIND,
  categorySchema,
  type CategoryInput,
} from "@/features/categories/schema";
import { PALETTE } from "@/lib/palette";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

export function CategoryForm({
  category,
  kind,
  parents,
  onDone,
}: {
  category: Category | null;
  kind: CategoryInput["kind"];
  /** Categorias principais ativas do mesmo tipo. */
  parents: Category[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const parentOptions = parents.filter((p) => p.id !== category?.id);
  const natures = NATURES_BY_KIND[kind];
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      kind,
      parent_id: category?.parent_id ?? null,
      nature: category?.nature ?? natures[0],
      color: PALETTE.find((c) => c === category?.color) ?? PALETTE[0],
    },
  });

  const run = (action: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await action();
      if (error) return void toast.error(error);
      toast.success(ok);
      onDone();
    });

  const parentItems: Record<string, string> = {
    [NONE]: "Nenhuma (principal)",
    ...Object.fromEntries(parentOptions.map((p) => [p.id, p.name])),
  };
  const natureItems = Object.fromEntries(
    natures.map((n) => [n, NATURE_LABELS[n]]),
  );

  return (
    <form
      onSubmit={handleSubmit((values) =>
        run(
          () => saveCategory(category?.id ?? null, values),
          category ? "Categoria atualizada." : "Categoria criada.",
        ),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <label className={labelClass}>
        Nome
        <Input
          className="h-11 text-base"
          autoFocus={!category}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </label>

      <div className={labelClass}>
        Subcategoria de
        <Controller
          control={control}
          name="parent_id"
          render={({ field }) => (
            <Select
              items={parentItems}
              value={field.value ?? NONE}
              onValueChange={(v) => field.onChange(v === NONE ? null : v)}
            >
              <SelectTrigger
                className="h-11 w-full"
                aria-label="Subcategoria de"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(parentItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className={labelClass}>
        Natureza
        <Controller
          control={control}
          name="nature"
          render={({ field }) => (
            <Select
              items={natureItems}
              value={field.value}
              onValueChange={(v) => v && field.onChange(v)}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Natureza">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {natures.map((n) => (
                  <SelectItem key={n} value={n}>
                    {NATURE_LABELS[n]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <ColorPicker value={field.value} onChange={field.onChange} />
        )}
      />

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>

      {category && (
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          disabled={pending}
          onClick={() =>
            run(
              () => setCategoryArchived(category.id, !category.archived_at),
              category.archived_at
                ? "Categoria reativada."
                : "Categoria arquivada.",
            )
          }
        >
          {category.archived_at ? "Reativar categoria" : "Arquivar categoria"}
        </Button>
      )}
    </form>
  );
}
