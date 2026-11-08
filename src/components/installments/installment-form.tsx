"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/field-error";
import { MoneyInput } from "@/components/money/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryItems } from "@/features/categories/items";
import { createInstallmentPlan } from "@/features/installments/actions";
import { previewInstallments } from "@/features/installments/preview";
import {
  installmentSchema,
  type InstallmentInput,
} from "@/features/installments/schema";
import type { TransactionOptions } from "@/features/transactions/actions";
import { formatDate, today } from "@/lib/finance/dates";
import { formatBRL, fromCents } from "@/lib/finance/money";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";
const toggleClass =
  "flex h-11 flex-1 items-center justify-center rounded-md border text-sm aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:font-medium";

export function InstallmentForm({
  options,
  onDone,
}: {
  options: TransactionOptions;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { accounts, cards, categories } = options;
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InstallmentInput>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      description: "",
      mode: "total",
      amount_cents: 0,
      count: 10,
      start: 1,
      first_date: today(),
      // Parcelamento costuma ser no cartão; conta = carnê/boleto.
      card_id: cards[0]?.id ?? null,
      account_id: cards[0] ? null : (accounts[0]?.id ?? null),
      category_id: null,
      notes: "",
    },
  });
  const [mode, amountCents, count, start, firstDate, cardId] = useWatch({
    control,
    name: ["mode", "amount_cents", "count", "start", "first_date", "card_id"],
  });

  if (accounts.length === 0 && cards.length === 0) {
    return (
      <p className="pb-4 text-center text-muted-foreground">
        Cadastre um cartão ou uma conta antes.{" "}
        <Link href="/cartoes" className="underline" onClick={onDone}>
          Ir para Cartões
        </Link>
      </p>
    );
  }

  const valid =
    amountCents > 0 &&
    Number.isInteger(count) &&
    count >= 2 &&
    count <= 420 &&
    Number.isInteger(start) &&
    start >= 1 &&
    start <= count &&
    /^\d{4}-\d{2}-\d{2}$/.test(firstDate);
  const preview = valid
    ? previewInstallments({ mode, amountCents, count, start, firstDate })
    : null;

  const sourceItems: Record<string, string> = {
    ...Object.fromEntries(
      cards.map((c) => [`card:${c.id}`, `${c.name} (cartão)`]),
    ),
    ...Object.fromEntries(accounts.map((a) => [`account:${a.id}`, a.name])),
  };
  const categoryOptions = {
    [NONE]: "Sem categoria",
    ...categoryItems(categories, "despesa"),
  };

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const { error } = await createInstallmentPlan(values);
      if (error) return void toast.error(error);
      toast.success("Parcelamento criado.");
      onDone();
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
      <label className={labelClass}>
        Descrição
        <Input
          className="h-11 text-base"
          placeholder="Ex.: Geladeira"
          autoFocus
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </label>

      <Controller
        control={control}
        name="mode"
        render={({ field }) => (
          <div role="group" aria-label="Tipo de valor" className="flex gap-2">
            {(
              [
                ["total", "Valor total"],
                ["parcela", "Valor da parcela"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={field.value === value}
                className={toggleClass}
                onClick={() => field.onChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      />

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <label className={labelClass}>
          {mode === "total" ? "Valor total" : "Valor da parcela"}
          <Controller
            control={control}
            name="amount_cents"
            render={({ field }) => (
              <MoneyInput
                value={field.value || null}
                onChange={(cents) => field.onChange(cents ?? 0)}
                aria-invalid={!!errors.amount_cents}
              />
            )}
          />
          <FieldError message={errors.amount_cents?.message} />
        </label>
        <label className={labelClass}>
          Parcelas
          <Input
            type="number"
            inputMode="numeric"
            min={2}
            max={420}
            className="h-11 text-base tabular-nums"
            aria-invalid={!!errors.count}
            {...register("count", { valueAsNumber: true })}
          />
          <FieldError message={errors.count?.message} />
        </label>
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-primary"
          checked={start > 1}
          onChange={(e) => setValue("start", e.target.checked ? 2 : 1)}
        />
        Compra em andamento (já paguei algumas parcelas)
      </label>

      <div className="grid grid-cols-2 gap-3">
        {start > 1 && (
          <label className={labelClass}>
            Parcela atual
            <Input
              type="number"
              inputMode="numeric"
              min={2}
              className="h-11 text-base tabular-nums"
              aria-invalid={!!errors.start}
              {...register("start", { valueAsNumber: true })}
            />
            <FieldError message={errors.start?.message} />
          </label>
        )}
        <label className={labelClass}>
          {start > 1 ? `Data da parcela ${start || ""}` : "Data da 1ª parcela"}
          <Input
            type="date"
            className="h-11 text-base"
            aria-invalid={!!errors.first_date}
            {...register("first_date")}
          />
          <FieldError message={errors.first_date?.message} />
        </label>
      </div>

      <div className={labelClass}>
        Cartão ou conta
        <Controller
          control={control}
          name="account_id"
          render={({ field }) => (
            <Select
              items={sourceItems}
              value={field.value ? `account:${field.value}` : `card:${cardId}`}
              onValueChange={(v) => {
                if (!v) return;
                const [kind, id] = v.split(":");
                field.onChange(kind === "account" ? id : null);
                setValue("card_id", kind === "card" ? id : null);
              }}
            >
              <SelectTrigger
                className="h-11 w-full"
                aria-label="Cartão ou conta"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.account_id?.message} />
      </div>

      <div className={labelClass}>
        Categoria
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <Select
              items={categoryOptions}
              value={field.value ?? NONE}
              onValueChange={(v) => field.onChange(v === NONE ? null : v)}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryOptions).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {preview && (
        <section aria-label="Prévia das parcelas" className="rounded-lg border">
          <p className="flex justify-between border-b px-3 py-2 text-sm">
            <span>
              {count}× de{" "}
              <strong className="tabular-nums">
                {formatBRL(fromCents(preview.installmentCents))}
              </strong>
            </span>
            <span className="text-muted-foreground tabular-nums">
              Total {formatBRL(fromCents(preview.totalCents))}
            </span>
          </p>
          <ol className="max-h-48 divide-y overflow-y-auto text-sm">
            {preview.rows.map((r) => (
              <li
                key={r.number}
                className="flex justify-between px-3 py-1.5 tabular-nums"
              >
                <span>
                  {r.number}/{count} · {formatDate(r.date)}
                </span>
                <span>{formatBRL(fromCents(r.cents))}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <label className={labelClass}>
        Observações{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
        <Input className="h-11 text-base" {...register("notes")} />
      </label>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Criando..." : "Criar parcelamento"}
      </Button>
    </form>
  );
}
