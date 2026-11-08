"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ColorPicker } from "@/components/color-picker";
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
import { saveCard, setCardArchived } from "@/features/cards/actions";
import type { Card } from "@/features/cards/queries";
import {
  CARD_BRANDS,
  cardSchema,
  type CardInput,
} from "@/features/cards/schema";
import { toCents } from "@/lib/finance/money";
import { PALETTE } from "@/lib/palette";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

function defaults(card: Card | null, accounts: { id: string }[]): CardInput {
  return {
    name: card?.name ?? "",
    issuer: card?.issuer ?? "",
    brand:
      card?.brand && card.brand in CARD_BRANDS
        ? (card.brand as keyof typeof CARD_BRANDS)
        : null,
    last_digits: card?.last_digits ?? "",
    credit_limit_cents: card ? toCents(card.credit_limit) : 0,
    closing_day: card?.closing_day ?? 1,
    due_day: card?.due_day ?? 10,
    payment_account_id: card
      ? card.payment_account_id
      : (accounts[0]?.id ?? null),
    color: PALETTE.find((c) => c === card?.color) ?? PALETTE[0],
  };
}

export function CardForm({
  card,
  accounts,
  onDone,
}: {
  card: Card | null;
  /** Contas ativas, para a conta padrão de pagamento. */
  accounts: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardInput>({
    resolver: zodResolver(cardSchema),
    defaultValues: defaults(card, accounts),
  });

  const run = (action: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await action();
      if (error) return void toast.error(error);
      toast.success(ok);
      onDone();
    });

  const brandItems = { [NONE]: "Não informar", ...CARD_BRANDS };
  const accountItems: Record<string, string> = {
    [NONE]: "Nenhuma",
    ...Object.fromEntries(accounts.map((a) => [a.id, a.name])),
  };

  return (
    <form
      onSubmit={handleSubmit((values) =>
        run(
          () => saveCard(card?.id ?? null, values),
          card ? "Cartão atualizado." : "Cartão criado.",
        ),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <label className={labelClass}>
        Nome
        <Input
          className="h-11 text-base"
          placeholder="Ex.: Nubank Roxinho"
          autoFocus={!card}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Emissor{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
          <Input
            className="h-11 text-base"
            placeholder="Ex.: Nubank"
            {...register("issuer")}
          />
        </label>
        <label className={labelClass}>
          Final{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
          <Input
            className="h-11 text-base tabular-nums"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            aria-invalid={!!errors.last_digits}
            {...register("last_digits")}
          />
          <FieldError message={errors.last_digits?.message} />
        </label>
      </div>

      <div className={labelClass}>
        Bandeira
        <Controller
          control={control}
          name="brand"
          render={({ field }) => (
            <Select
              items={brandItems}
              value={field.value ?? NONE}
              onValueChange={(v) => field.onChange(!v || v === NONE ? null : v)}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Bandeira">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(brandItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <label className={labelClass}>
        Limite
        <Controller
          control={control}
          name="credit_limit_cents"
          render={({ field }) => (
            <MoneyInput
              value={field.value}
              onChange={(cents) => field.onChange(cents ?? 0)}
            />
          )}
        />
        <FieldError message={errors.credit_limit_cents?.message} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["closing_day", "Dia do fechamento"],
            ["due_day", "Dia do vencimento"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className={labelClass}>
            {label}
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              className="h-11 text-base tabular-nums"
              aria-invalid={!!errors[name]}
              {...register(name, { valueAsNumber: true })}
            />
            <FieldError message={errors[name]?.message} />
          </label>
        ))}
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Compras no dia do fechamento ou depois caem na fatura seguinte.
      </p>

      <div className={labelClass}>
        Conta para pagar a fatura
        <Controller
          control={control}
          name="payment_account_id"
          render={({ field }) => (
            <Select
              items={accountItems}
              value={field.value ?? NONE}
              onValueChange={(v) => field.onChange(!v || v === NONE ? null : v)}
            >
              <SelectTrigger
                className="h-11 w-full"
                aria-label="Conta para pagar a fatura"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(accountItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
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

      {card && (
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          disabled={pending}
          onClick={() =>
            run(
              () => setCardArchived(card.id, !card.archived_at),
              card.archived_at ? "Cartão reativado." : "Cartão arquivado.",
            )
          }
        >
          {card.archived_at ? "Reativar cartão" : "Arquivar cartão"}
        </Button>
      )}
    </form>
  );
}
