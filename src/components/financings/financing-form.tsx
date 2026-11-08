"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useTransition } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type DefaultValues,
  type FieldPath,
} from "react-hook-form";
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
import { saveFinancing } from "@/features/financings/actions";
import type { Financing } from "@/features/financings/queries";
import {
  FINANCING_KIND_LABELS,
  RATE_PERIOD_LABELS,
  SYSTEM_LABELS,
  financingSchema,
  parseRate,
  type FinancingInput,
} from "@/features/financings/schema";
import type { TransactionOptions } from "@/features/transactions/actions";
import { addMonths, today } from "@/lib/finance/dates";
import { toCents } from "@/lib/finance/money";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";
const optional = (
  <span className="font-normal text-muted-foreground">(opcional)</span>
);

function defaults(
  f: Financing | null,
  options: TransactionOptions,
): DefaultValues<FinancingInput> {
  if (f)
    return {
      name: f.name,
      kind: f.kind,
      institution: f.institution ?? "",
      financed_cents: toCents(f.financed_amount),
      down_payment_cents: toCents(f.down_payment),
      interest_rate: f.interest_rate,
      rate_period: f.rate_period,
      system: f.system,
      term_months: f.term_months,
      first_due_date: f.first_due_date,
      monthly_fees_cents: toCents(f.monthly_fees),
      paid_installments_before: f.paid_installments_before,
      account_id: f.account_id,
      category_id: f.category_id,
    };
  return {
    name: "",
    kind: "imovel",
    institution: "",
    financed_cents: 0,
    down_payment_cents: 0,
    // Sem taxa padrão: o campo começa vazio.
    rate_period: "ano",
    system: "price",
    term_months: 360,
    first_due_date: addMonths(today(), 1),
    monthly_fees_cents: 0,
    paid_installments_before: 0,
    account_id: options.accounts[0]?.id ?? "",
    category_id:
      options.categories.find(
        (c) => c.kind === "despesa" && c.name === "Financiamentos",
      )?.id ?? null,
  };
}

export function FinancingForm({
  financing,
  options,
  onDone,
}: {
  financing: Financing | null;
  options: TransactionOptions;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FinancingInput>({
    resolver: zodResolver(financingSchema),
    defaultValues: defaults(financing, options),
  });
  const system = useWatch({ control, name: "system" });
  // O campo de taxa some em "sem juros"; a taxa vale 0.
  useEffect(() => {
    if (system === "sem_juros") setValue("interest_rate", 0);
  }, [system, setValue]);

  if (options.accounts.length === 0) {
    return (
      <p className="pb-4 text-center text-muted-foreground">
        Cadastre a conta de onde as parcelas saem.{" "}
        <Link href="/contas" className="underline" onClick={onDone}>
          Ir para Contas
        </Link>
      </p>
    );
  }

  const accountItems = Object.fromEntries(
    options.accounts.map((a) => [a.id, a.name]),
  );
  const categoryOptions = {
    [NONE]: "Sem categoria",
    ...categoryItems(options.categories, "despesa"),
  };

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const { error } = await saveFinancing(financing?.id ?? null, values);
          if (error) return void toast.error(error);
          toast.success(
            financing ? "Financiamento atualizado." : "Financiamento criado.",
          );
          onDone();
        }),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <label className={labelClass}>
        Nome
        <Input
          className="h-11 text-base"
          placeholder="Ex.: Apartamento"
          autoFocus={!financing}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <FormSelect
          control={control}
          name="kind"
          label="Tipo"
          items={FINANCING_KIND_LABELS}
        />
        <label className={labelClass}>
          <span>Instituição {optional}</span>
          <Input
            className="h-11 text-base"
            placeholder="Ex.: Caixa"
            {...register("institution")}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Valor financiado
          <Controller
            control={control}
            name="financed_cents"
            render={({ field }) => (
              <MoneyInput
                value={field.value || null}
                onChange={(c) => field.onChange(c ?? 0)}
                aria-invalid={!!errors.financed_cents}
              />
            )}
          />
          <FieldError message={errors.financed_cents?.message} />
        </label>
        <label className={labelClass}>
          <span>Entrada {optional}</span>
          <Controller
            control={control}
            name="down_payment_cents"
            render={({ field }) => (
              <MoneyInput
                value={field.value || null}
                onChange={(c) => field.onChange(c ?? 0)}
              />
            )}
          />
        </label>
      </div>

      <FormSelect
        control={control}
        name="system"
        label="Sistema de amortização"
        items={SYSTEM_LABELS}
      />

      {system !== "sem_juros" && (
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Taxa de juros (%)
            <Input
              inputMode="decimal"
              placeholder="Ex.: 10,5"
              className="h-11 text-base tabular-nums"
              aria-invalid={!!errors.interest_rate}
              {...register("interest_rate", { setValueAs: parseRate })}
            />
            <FieldError message={errors.interest_rate?.message} />
          </label>
          <FormSelect
            control={control}
            name="rate_period"
            label="Período da taxa"
            items={RATE_PERIOD_LABELS}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Prazo (meses)
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={480}
            className="h-11 text-base tabular-nums"
            aria-invalid={!!errors.term_months}
            {...register("term_months", { valueAsNumber: true })}
          />
          <FieldError message={errors.term_months?.message} />
        </label>
        <label className={labelClass}>
          1ª parcela
          <Input
            type="date"
            className="h-11 text-base"
            aria-invalid={!!errors.first_due_date}
            {...register("first_due_date")}
          />
          <FieldError message={errors.first_due_date?.message} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span>Seguros e taxas/mês {optional}</span>
          <Controller
            control={control}
            name="monthly_fees_cents"
            render={({ field }) => (
              <MoneyInput
                value={field.value || null}
                onChange={(c) => field.onChange(c ?? 0)}
              />
            )}
          />
        </label>
        <label className={labelClass}>
          Parcelas já pagas
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            className="h-11 text-base tabular-nums"
            aria-invalid={!!errors.paid_installments_before}
            {...register("paid_installments_before", { valueAsNumber: true })}
          />
          <FieldError message={errors.paid_installments_before?.message} />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Já está pagando? Informe a data da 1ª parcela original e quantas já
        pagou: o app não cria lançamentos para essas.
      </p>

      <FormSelect
        control={control}
        name="account_id"
        label="Conta de débito"
        items={accountItems}
        error={errors.account_id?.message}
      />
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

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Gerando parcelas..." : "Salvar e gerar parcelas"}
      </Button>
    </form>
  );
}

/** Select obrigatório ligado ao form (valor = chave de `items`). */
function FormSelect({
  control,
  name,
  label,
  items,
  error,
}: {
  control: Control<FinancingInput>;
  name: FieldPath<FinancingInput>;
  label: string;
  items: Record<string, string>;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={labelClass}>
          {label}
          <Select
            items={items}
            value={(field.value as string) || null}
            onValueChange={(v) => v && field.onChange(v)}
          >
            <SelectTrigger className="h-11 w-full" aria-label={label}>
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(items).map(([value, text]) => (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={error} />
        </div>
      )}
    />
  );
}
