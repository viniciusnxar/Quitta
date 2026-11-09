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
import { saveRecurringRule } from "@/features/recurring/actions";
import type { RecurringRule } from "@/features/recurring/queries";
import {
  recurringSchema,
  type RecurringInput,
} from "@/features/recurring/schema";
import { CYCLE_LABELS } from "@/features/subscriptions/schema";
import type { TransactionOptions } from "@/features/transactions/actions";
import { FORM_TYPES, TYPE_LABELS } from "@/features/transactions/schema";
import { today } from "@/lib/finance/dates";
import { toCents } from "@/lib/finance/money";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";
const toggleClass =
  "flex h-11 flex-1 items-center justify-center rounded-md border text-sm aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:font-medium";

function defaults(
  r: RecurringRule | null,
  { accounts, cards }: TransactionOptions,
): RecurringInput {
  if (r)
    return {
      type: r.type,
      description: r.description,
      amount_cents: toCents(r.amount),
      cycle: r.cycle,
      start_date: r.start_date,
      end_date: r.end_date,
      account_id: r.account_id,
      card_id: r.card_id,
      to_account_id: r.to_account_id,
      category_id: r.category_id,
      auto_confirm: r.auto_confirm,
    };
  return {
    type: "despesa",
    description: "",
    amount_cents: 0,
    cycle: "mensal",
    start_date: today(),
    end_date: null,
    account_id: accounts[0]?.id ?? null,
    card_id: accounts[0] ? null : (cards[0]?.id ?? null),
    to_account_id: null,
    category_id: null,
    auto_confirm: false,
  };
}

export function RecurringForm({
  rule,
  options,
  onDone,
}: {
  rule: RecurringRule | null;
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
  } = useForm<RecurringInput>({
    resolver: zodResolver(recurringSchema),
    defaultValues: defaults(rule, options),
  });
  const type = useWatch({ control, name: "type" });
  const cardId = useWatch({ control, name: "card_id" });
  const transfer = type === "transferencia";

  if (accounts.length === 0) {
    return (
      <p className="pb-4 text-center text-muted-foreground">
        Cadastre uma conta antes.{" "}
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
    ...categoryItems(categories, type),
  };
  const cycleItems: Record<string, string> = CYCLE_LABELS;

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const { error } = await saveRecurringRule(rule?.id ?? null, values);
          if (error) return void toast.error(error);
          toast.success(
            rule ? "Recorrência atualizada." : "Recorrência criada.",
          );
          onDone();
        }),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <div role="group" aria-label="Tipo" className="flex gap-2">
        {FORM_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            className={toggleClass}
            onClick={() => {
              setValue("type", t);
              setValue("category_id", null);
              if (t === "transferencia") {
                setValue("card_id", null);
                setValue("account_id", accounts[0].id);
              } else setValue("to_account_id", null);
            }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <label className={labelClass}>
        Descrição
        <Input
          className="h-11 text-base"
          placeholder={
            type === "receita"
              ? "Ex.: Salário"
              : transfer
                ? "Ex.: Reserva mensal"
                : "Ex.: Aluguel"
          }
          autoFocus={!rule}
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Valor
          <Controller
            control={control}
            name="amount_cents"
            render={({ field }) => (
              <MoneyInput
                value={field.value || null}
                onChange={(c) => field.onChange(c ?? 0)}
                aria-invalid={!!errors.amount_cents}
              />
            )}
          />
          <FieldError message={errors.amount_cents?.message} />
        </label>
        <Controller
          control={control}
          name="cycle"
          render={({ field }) => (
            <div className={labelClass}>
              Repete
              <Select
                items={cycleItems}
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
              >
                <SelectTrigger className="h-11 w-full" aria-label="Repete">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(cycleItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

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
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <div className={labelClass}>
              Categoria
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
            </div>
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          1ª ocorrência
          <Input
            type="date"
            className="h-11 text-base"
            aria-invalid={!!errors.start_date}
            {...register("start_date")}
          />
          <FieldError message={errors.start_date?.message} />
        </label>
        <label className={labelClass}>
          <span>
            Termina em{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </span>
          <Input
            type="date"
            className="h-11 text-base"
            aria-invalid={!!errors.end_date}
            {...register("end_date", { setValueAs: (v) => v || null })}
          />
          <FieldError message={errors.end_date?.message} />
        </label>
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-primary"
          {...register("auto_confirm")}
        />
        <span>
          Marcar como pago na data
          <span className="block text-xs text-muted-foreground">
            Para débito automático e salário. Sem isso, fica previsto até você
            confirmar.
          </span>
        </span>
      </label>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
