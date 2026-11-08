"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ColorPicker } from "@/components/color-picker";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteTag, saveTag } from "@/features/categories/actions";
import type { Tag } from "@/features/categories/queries";
import { tagSchema, type TagInput } from "@/features/categories/schema";
import { PALETTE } from "@/lib/palette";

export function TagForm({
  tag,
  onDone,
}: {
  tag: Tag | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name ?? "",
      color: PALETTE.find((c) => c === tag?.color) ?? PALETTE[0],
    },
  });

  const run = (action: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await action();
      if (error) return void toast.error(error);
      toast.success(ok);
      onDone();
    });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        run(
          () => saveTag(tag?.id ?? null, values),
          tag ? "Tag atualizada." : "Tag criada.",
        ),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nome
        <Input
          className="h-11 text-base"
          placeholder="Ex.: viagem-2026"
          autoFocus={!tag}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </label>

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

      {tag && (
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-destructive"
          disabled={pending}
          onClick={() => run(() => deleteTag(tag.id), "Tag excluída.")}
        >
          Excluir tag
        </Button>
      )}
    </form>
  );
}
