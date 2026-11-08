"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { saveAccount, setAccountArchived } from "@/features/accounts/actions";
import type { Account } from "@/features/accounts/queries";
import {
  ACCOUNT_COLORS,
  ACCOUNT_ICONS,
  ACCOUNT_TYPE_LABELS,
  accountSchema,
  type AccountInput,
} from "@/features/accounts/schema";
import { today } from "@/lib/finance/dates";
import { toCents } from "@/lib/finance/money";
import { cn } from "@/lib/utils";
import { ACCOUNT_ICON_COMPONENTS } from "./account-icon";

function defaults(account: Account | null): AccountInput {
  if (!account) {
    return {
      name: "",
      institution: "",
      type: "corrente",
      initial_balance_cents: 0,
      initial_balance_date: today(),
      color: ACCOUNT_COLORS[0],
      icon: ACCOUNT_ICONS[0],
      include_in_total: true,
    };
  }
  const pick = <T extends string>(list: readonly T[], v: string | null) =>
    list.includes(v as T) ? (v as T) : list[0];
  return {
    name: account.name,
    institution: account.institution ?? "",
    type: account.type,
    initial_balance_cents: toCents(account.initial_balance),
    initial_balance_date: account.initial_balance_date,
    color: pick(ACCOUNT_COLORS, account.color),
    icon: pick(ACCOUNT_ICONS, account.icon),
    include_in_total: account.include_in_total,
  };
}

const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

export function AccountForm({
  account,
  onDone,
}: {
  account: Account | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaults(account),
  });

  const run = (action: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await action();
      if (error) return void toast.error(error);
      toast.success(ok);
      onDone();
    });

  const onSubmit = handleSubmit((values) =>
    run(
      () => saveAccount(account?.id ?? null, values),
      account ? "Conta atualizada." : "Conta criada.",
    ),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
      <label className={labelClass}>
        Nome
        <Input
          className="h-11 text-base"
          placeholder="Ex.: Nubank"
          autoFocus={!account}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </label>

      <label className={labelClass}>
        Instituição{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
        <Input
          className="h-11 text-base"
          placeholder="Ex.: Nu Pagamentos"
          {...register("institution")}
        />
      </label>

      <div className={labelClass}>
        Tipo
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              items={ACCOUNT_TYPE_LABELS}
              value={field.value}
              onValueChange={(v) => v && field.onChange(v)}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Saldo inicial
          <Controller
            control={control}
            name="initial_balance_cents"
            render={({ field }) => (
              <MoneyInput
                value={field.value}
                onChange={(cents) => field.onChange(cents ?? 0)}
              />
            )}
          />
        </label>
        <label className={labelClass}>
          Saldo em
          <Input
            type="date"
            className="h-11 text-base"
            {...register("initial_balance_date")}
          />
          <FieldError message={errors.initial_balance_date?.message} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Cor</legend>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Cor ${color}`}
                  aria-pressed={field.value === color}
                  onClick={() => field.onChange(color)}
                  className="size-11 rounded-full ring-offset-2 ring-offset-background aria-pressed:ring-2 aria-pressed:ring-foreground"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Ícone</legend>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_ICONS.map((icon) => {
                const Icon = ACCOUNT_ICON_COMPONENTS[icon];
                return (
                  <button
                    key={icon}
                    type="button"
                    aria-label={`Ícone ${icon}`}
                    aria-pressed={field.value === icon}
                    onClick={() => field.onChange(icon)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-md border",
                      "aria-pressed:border-foreground aria-pressed:bg-accent",
                    )}
                  >
                    <Icon className="size-5" />
                  </button>
                );
              })}
            </div>
          )}
        />
      </fieldset>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-primary"
          {...register("include_in_total")}
        />
        Incluir no saldo total
      </label>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>

      {account && (
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          disabled={pending}
          onClick={() =>
            run(
              () => setAccountArchived(account.id, !account.archived_at),
              account.archived_at ? "Conta reativada." : "Conta arquivada.",
            )
          }
        >
          {account.archived_at ? "Reativar conta" : "Arquivar conta"}
        </Button>
      )}
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="text-xs font-normal text-destructive">
      {message}
    </span>
  );
}
