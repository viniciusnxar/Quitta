"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
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
import { saveSubscription } from "@/features/subscriptions/actions";
import type { Subscription } from "@/features/subscriptions/queries";
import {
  CYCLE_LABELS,
  subscriptionSchema,
  type SubscriptionInput,
} from "@/features/subscriptions/schema";
import type { TransactionOptions } from "@/features/transactions/actions";
import type { Provider } from "@/lib/catalog/subscriptions";
import { today } from "@/lib/finance/dates";
import { toCents } from "@/lib/finance/money";
import { ProviderLogo } from "./provider-logo";
import { ProviderPicker } from "./provider-picker";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

/** Nova assinatura: escolhe no catálogo e depois preenche o formulário. */
export function NewSubscription({
  options,
  onDone,
}: {
  options: TransactionOptions;
  onDone: () => void;
}) {
  // undefined = ainda escolhendo; null = fora do catálogo.
  const [provider, setProvider] = useState<Provider | null | undefined>();
  if (provider === undefined) return <ProviderPicker onSelect={setProvider} />;

  const { accounts, cards, categories } = options;
  const category = categories.find(
    (c) => c.kind === "despesa" && c.name === provider?.category,
  );
  return (
    <SubscriptionForm
      id={null}
      options={options}
      onDone={onDone}
      onBack={() => setProvider(undefined)}
      initial={{
        provider: provider?.slug ?? null,
        name: provider?.name ?? "",
        amount_cents: 0,
        cycle: "mensal",
        start_date: today(),
        card_id: cards[0]?.id ?? null,
        account_id: cards[0] ? null : (accounts[0]?.id ?? null),
        category_id: category?.id ?? null,
      }}
    />
  );
}

export function subscriptionToInput(s: Subscription): SubscriptionInput {
  return {
    provider: s.provider,
    name: s.name,
    amount_cents: toCents(s.amount),
    cycle: s.cycle,
    start_date: s.start_date,
    account_id: s.account_id,
    card_id: s.card_id,
    category_id: s.category_id,
  };
}

export function SubscriptionForm({
  id,
  initial,
  options,
  onDone,
  onBack,
}: {
  id: string | null;
  initial: SubscriptionInput;
  options: TransactionOptions;
  onDone: () => void;
  onBack?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { accounts, cards, categories } = options;
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: initial,
  });
  const cardId = useWatch({ control, name: "card_id" });

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

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const { error } = await saveSubscription(id, values);
          if (error) return void toast.error(error);
          toast.success(id ? "Assinatura atualizada." : "Assinatura criada.");
          onDone();
        }),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <div className="flex items-center gap-3">
        <ProviderLogo provider={initial.provider} />
        <label className={`${labelClass} flex-1`}>
          Nome
          <Input
            className="h-11 text-base"
            placeholder="Ex.: Academia"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div className={labelClass}>
          Ciclo
          <Controller
            control={control}
            name="cycle"
            render={({ field }) => (
              <Select
                items={CYCLE_LABELS}
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
              >
                <SelectTrigger className="h-11 w-full" aria-label="Ciclo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CYCLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <label className={labelClass}>
        Data de uma cobrança
        <Input
          type="date"
          className="h-11 text-base"
          aria-invalid={!!errors.start_date}
          {...register("start_date")}
        />
        <span className="text-xs font-normal text-muted-foreground">
          As próximas seguem o ciclo a partir dessa data.
        </span>
        <FieldError message={errors.start_date?.message} />
      </label>

      <div className={labelClass}>
        Cobrada em
        <Controller
          control={control}
          name="account_id"
          render={({ field }) => (
            <Select
              items={sourceItems}
              value={field.value ? `account:${field.value}` : `card:${cardId}`}
              onValueChange={(v) => {
                if (!v) return;
                const [kind, sourceId] = v.split(":");
                field.onChange(kind === "account" ? sourceId : null);
                setValue("card_id", kind === "card" ? sourceId : null);
              }}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Cobrada em">
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

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={onBack}
          disabled={pending}
        >
          Escolher outro serviço
        </Button>
      )}
    </form>
  );
}
