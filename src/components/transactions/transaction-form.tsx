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
import {
  createTransaction,
  type TransactionOptions,
} from "@/features/transactions/actions";
import {
  FORM_TYPES,
  TYPE_LABELS,
  transactionSchema,
  type FormType,
  type TransactionInput,
} from "@/features/transactions/schema";
import { today } from "@/lib/finance/dates";
import { cn } from "@/lib/utils";
import { categoryItems } from "@/features/categories/items";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";
const toggleClass =
  "flex h-11 flex-1 items-center justify-center rounded-md border text-sm aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:font-medium";

export function TransactionForm({
  type,
  options,
  onDone,
}: {
  type: FormType;
  options: TransactionOptions;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { accounts, cards, categories, tags } = options;
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type,
      description: "",
      amount_cents: 0,
      date: today(),
      status: "pago",
      account_id: accounts[0]?.id ?? null,
      card_id: accounts[0] ? null : (cards[0]?.id ?? null),
      to_account_id: null,
      category_id: null,
      tag_ids: [],
      notes: "",
    },
  });
  const currentType = useWatch({ control, name: "type" });
  const cardId = useWatch({ control, name: "card_id" });
  const transfer = currentType === "transferencia";

  if (accounts.length === 0 && cards.length === 0) {
    return (
      <p className="pb-4 text-center text-muted-foreground">
        Cadastre uma conta antes de lançar.{" "}
        <Link href="/contas" className="underline" onClick={onDone}>
          Ir para Contas
        </Link>
      </p>
    );
  }

  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const sourceItems: Record<string, string> = {
    ...Object.fromEntries(accounts.map((a) => [`account:${a.id}`, a.name])),
    ...Object.fromEntries(
      cards.map((c) => [`card:${c.id}`, `${c.name} (cartão)`]),
    ),
  };
  const categoryOptions = {
    [NONE]: "Sem categoria",
    ...categoryItems(categories, currentType),
  };

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const { error } = await createTransaction(values);
      if (error) return void toast.error(error);
      toast.success(`${TYPE_LABELS[values.type]} salva.`);
      onDone();
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
      <div role="group" aria-label="Tipo" className="flex gap-2">
        {FORM_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={currentType === t}
            className={toggleClass}
            onClick={() => {
              setValue("type", t);
              setValue("category_id", null);
              if (t === "transferencia") {
                setValue("card_id", null);
                setValue("account_id", accounts[0]?.id ?? null);
              } else setValue("to_account_id", null);
            }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <label className={labelClass}>
        Valor
        <Controller
          control={control}
          name="amount_cents"
          render={({ field }) => (
            <MoneyInput
              autoFocus
              value={field.value || null}
              onChange={(cents) => field.onChange(cents ?? 0)}
              aria-invalid={!!errors.amount_cents}
            />
          )}
        />
        <FieldError message={errors.amount_cents?.message} />
      </label>

      <label className={labelClass}>
        Descrição
        <Input
          className="h-11 text-base"
          placeholder={transfer ? "Ex.: Reserva" : "Ex.: Mercado"}
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </label>

      {transfer ? (
        <div className="grid grid-cols-2 gap-3">
          {(["account_id", "to_account_id"] as const).map((name) => (
            <div key={name} className={labelClass}>
              {name === "account_id" ? "De" : "Para"}
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <Select
                    items={accountItems}
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger
                      className="h-11 w-full"
                      aria-label={name === "account_id" ? "De" : "Para"}
                    >
                      <SelectValue placeholder="Escolha" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors[name]?.message} />
            </div>
          ))}
        </div>
      ) : (
        <div className={labelClass}>
          Conta ou cartão
          <Controller
            control={control}
            name="account_id"
            render={({ field }) => (
              <Select
                items={sourceItems}
                value={
                  field.value ? `account:${field.value}` : `card:${cardId}`
                }
                onValueChange={(v) => {
                  if (!v) return;
                  const [kind, id] = v.split(":");
                  field.onChange(kind === "account" ? id : null);
                  setValue("card_id", kind === "card" ? id : null);
                }}
              >
                <SelectTrigger
                  className="h-11 w-full"
                  aria-label="Conta ou cartão"
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
      )}

      {!transfer && (
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
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Data
          <Input
            type="date"
            className="h-11 text-base"
            aria-invalid={!!errors.date}
            {...register("date")}
          />
          <FieldError message={errors.date?.message} />
        </label>
        <div className={labelClass}>
          Status
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div role="group" aria-label="Status" className="flex gap-2">
                {(["pago", "previsto"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={field.value === s}
                    className={toggleClass}
                    onClick={() => field.onChange(s)}
                  >
                    {s === "pago" ? "Pago" : "Previsto"}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {!transfer && tags.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Tags</legend>
          <Controller
            control={control}
            name="tag_ids"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const on = field.value.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        field.onChange(
                          on
                            ? field.value.filter((id) => id !== tag.id)
                            : [...field.value, tag.id],
                        )
                      }
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm",
                        "aria-pressed:border-foreground aria-pressed:bg-accent",
                      )}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: tag.color ?? "#a3a3a3" }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </fieldset>
      )}

      <label className={labelClass}>
        Observações{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
        <Input className="h-11 text-base" {...register("notes")} />
        <FieldError message={errors.notes?.message} />
      </label>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
