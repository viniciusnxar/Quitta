"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
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
import { parseRate } from "@/features/financings/schema";
import { saveInvestment } from "@/features/investments/actions";
import type { Investment } from "@/features/investments/queries";
import {
  INVESTMENT_KIND_LABELS,
  LIQUIDITY_LABELS,
  RATE_MODE_LABELS,
  RATE_MODES_WITH_RATE,
  TAX_EXEMPT_KINDS,
  investmentSchema,
  type InvestmentInput,
  type InvestmentKind,
} from "@/features/investments/schema";
import { today } from "@/lib/finance/dates";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";
const optional = (
  <span className="font-normal text-muted-foreground">(opcional)</span>
);

function defaults(i: Investment | null): InvestmentInput {
  if (i)
    return {
      name: i.name,
      kind: i.kind,
      institution: i.institution ?? "",
      account_id: i.account_id,
      rate_mode: i.rate_mode,
      rate: i.rate,
      rate_period: i.rate_period,
      start_date: i.start_date,
      maturity_date: i.maturity_date,
      liquidity: i.liquidity,
      liquidity_days: i.liquidity_days,
      tax_exempt: i.tax_exempt,
      ir_rate_override: i.ir_rate_override,
      status: i.status,
      notes: i.notes ?? "",
    };
  return {
    name: "",
    kind: "cdb",
    institution: "",
    account_id: null,
    rate_mode: "pos_cdi",
    rate: null,
    rate_period: "ano",
    start_date: today(),
    maturity_date: null,
    liquidity: "diaria",
    liquidity_days: null,
    tax_exempt: false,
    ir_rate_override: null,
    status: "ativo",
    notes: "",
  };
}

export function InvestmentForm({
  investment,
  accounts,
  onDone,
}: {
  investment: Investment | null;
  accounts: { id: string; name: string }[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InvestmentInput>({
    resolver: zodResolver(investmentSchema),
    defaultValues: defaults(investment),
  });
  const rateMode = useWatch({ control, name: "rate_mode" });
  const liquidity = useWatch({ control, name: "liquidity" });
  const taxExempt = useWatch({ control, name: "tax_exempt" });
  const hasRate = RATE_MODES_WITH_RATE.includes(rateMode);

  const accountItems = {
    [NONE]: "Nenhuma",
    ...Object.fromEntries(accounts.map((a) => [a.id, a.name])),
  };

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const { error, id } = await saveInvestment(
            investment?.id ?? null,
            values,
          );
          if (error) return void toast.error(error);
          toast.success(
            investment ? "Investimento atualizado." : "Investimento criado.",
          );
          onDone();
          if (!investment && id) router.push(`/investimentos/${id}`);
        }),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <label className={labelClass}>
        Nome
        <Input
          className="h-11 text-base"
          placeholder="Ex.: CDB Banco X 2028"
          autoFocus={!investment}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <SelectField
              label="Tipo"
              items={INVESTMENT_KIND_LABELS}
              value={field.value}
              onChange={(v) => {
                field.onChange(v);
                setValue(
                  "tax_exempt",
                  TAX_EXEMPT_KINDS.includes(v as InvestmentKind),
                );
                if (v === "poupanca") setValue("rate_mode", "poupanca");
              }}
            />
          )}
        />
        <label className={labelClass}>
          <span>Instituição {optional}</span>
          <Input
            className="h-11 text-base"
            placeholder="Ex.: Nubank"
            {...register("institution")}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="rate_mode"
          render={({ field }) => (
            <SelectField
              label="Rentabilidade"
              items={RATE_MODE_LABELS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {hasRate && (
          <label className={labelClass}>
            {rateMode === "pos_cdi" ? "% do CDI" : "Taxa (%)"}
            <Input
              inputMode="decimal"
              placeholder={rateMode === "pos_cdi" ? "Ex.: 110" : "Ex.: 6,5"}
              className="h-11 text-base tabular-nums"
              aria-invalid={!!errors.rate}
              {...register("rate", {
                setValueAs: (v) =>
                  v === "" || v == null ? null : parseRate(v),
              })}
            />
            <FieldError message={errors.rate?.message} />
          </label>
        )}
      </div>
      {rateMode === "prefixado" && (
        <Controller
          control={control}
          name="rate_period"
          render={({ field }) => (
            <SelectField
              label="Período da taxa"
              items={{ ano: "ao ano", mes: "ao mês" }}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Aplicação
          <Input
            type="date"
            className="h-11 text-base"
            aria-invalid={!!errors.start_date}
            {...register("start_date")}
          />
          <FieldError message={errors.start_date?.message} />
        </label>
        <label className={labelClass}>
          <span>Vencimento {optional}</span>
          <Input
            type="date"
            className="h-11 text-base"
            aria-invalid={!!errors.maturity_date}
            {...register("maturity_date", { setValueAs: (v) => v || null })}
          />
          <FieldError message={errors.maturity_date?.message} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="liquidity"
          render={({ field }) => (
            <SelectField
              label="Liquidez"
              items={LIQUIDITY_LABELS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {liquidity === "d_mais_n" && (
          <label className={labelClass}>
            Dias para resgate
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              className="h-11 text-base tabular-nums"
              aria-invalid={!!errors.liquidity_days}
              {...register("liquidity_days", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
            <FieldError message={errors.liquidity_days?.message} />
          </label>
        )}
      </div>

      <Controller
        control={control}
        name="account_id"
        render={({ field }) => (
          <SelectField
            label="Conta padrão dos aportes"
            items={accountItems}
            value={field.value ?? NONE}
            onChange={(v) => field.onChange(v === NONE ? null : v)}
          />
        )}
      />

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-primary"
          {...register("tax_exempt")}
        />
        <span>
          Isento de IR
          <span className="block text-xs text-muted-foreground">
            LCI, LCA, CRI, CRA e poupança costumam ser isentos para pessoa
            física. Confira a regra vigente.
          </span>
        </span>
      </label>

      {!taxExempt && (
        <label className={labelClass}>
          <span>IR com alíquota fixa (%) {optional}</span>
          <Input
            inputMode="decimal"
            placeholder="Tabela regressiva"
            className="h-11 text-base tabular-nums"
            aria-invalid={!!errors.ir_rate_override}
            {...register("ir_rate_override", {
              setValueAs: (v) => (v === "" || v == null ? null : parseRate(v)),
            })}
          />
          <FieldError message={errors.ir_rate_override?.message} />
        </label>
      )}

      {investment && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={field.value === "resgatado"}
                onChange={(e) =>
                  field.onChange(e.target.checked ? "resgatado" : "ativo")
                }
              />
            )}
          />
          Já resgatei tudo (encerrado)
        </label>
      )}

      <label className={labelClass}>
        <span>Observações {optional}</span>
        <Input className="h-11 text-base" {...register("notes")} />
        <FieldError message={errors.notes?.message} />
      </label>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

function SelectField({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Record<string, string>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={labelClass}>
      {label}
      <Select
        items={items}
        value={value}
        onValueChange={(v) => v && onChange(v)}
      >
        <SelectTrigger className="h-11 w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(items).map(([v, text]) => (
            <SelectItem key={v} value={v}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
