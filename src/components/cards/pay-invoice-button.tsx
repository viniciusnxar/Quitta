"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/field-error";
import { MoneyInput } from "@/components/money/money-input";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { payInvoice } from "@/features/cards/actions";
import {
  payInvoiceSchema,
  type PayInvoiceInput,
} from "@/features/cards/schema";
import { today } from "@/lib/finance/dates";
import { formatBRL, toCents } from "@/lib/finance/money";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

export function PayInvoiceButton({
  invoiceId,
  remaining,
  accounts,
  defaultAccountId,
}: {
  invoiceId: string;
  /** Restante em reais. */
  remaining: number;
  accounts: { id: string; name: string }[];
  defaultAccountId: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="h-11" onClick={() => setOpen(true)}>
        Pagar fatura
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Pagar fatura">
        {open && (
          <PayForm
            invoiceId={invoiceId}
            remainingCents={toCents(remaining)}
            accounts={accounts}
            defaultAccountId={
              accounts.some((a) => a.id === defaultAccountId)
                ? defaultAccountId
                : (accounts[0]?.id ?? null)
            }
            onDone={() => setOpen(false)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}

function PayForm({
  invoiceId,
  remainingCents,
  accounts,
  defaultAccountId,
  onDone,
}: {
  invoiceId: string;
  remainingCents: number;
  accounts: { id: string; name: string }[];
  defaultAccountId: string | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PayInvoiceInput>({
    resolver: zodResolver(
      payInvoiceSchema.refine((v) => v.amount_cents <= remainingCents, {
        path: ["amount_cents"],
        message: "O valor passa do que falta pagar.",
      }),
    ),
    defaultValues: {
      invoice_id: invoiceId,
      // zod barra o vazio com "Escolha a conta."
      account_id: defaultAccountId ?? "",
      amount_cents: remainingCents,
      date: today(),
    },
  });

  if (accounts.length === 0) {
    return (
      <p className="pb-4 text-center text-muted-foreground">
        Cadastre uma conta para pagar a fatura.
      </p>
    );
  }

  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const { error } = await payInvoice(values);
          if (error) return void toast.error(error);
          toast.success(
            values.amount_cents < remainingCents
              ? "Pagamento parcial registrado."
              : "Fatura paga.",
          );
          onDone();
        }),
      )}
      className="flex flex-col gap-4 pb-2"
    >
      <label className={labelClass}>
        Valor
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
        <span className="flex items-center justify-between text-xs font-normal text-muted-foreground">
          Restante: {formatBRL(remainingCents / 100)}
          <button
            type="button"
            className="min-h-11 px-1 underline"
            onClick={() => setValue("amount_cents", remainingCents)}
          >
            Pagar total
          </button>
        </span>
        <FieldError message={errors.amount_cents?.message} />
      </label>

      <div className={labelClass}>
        Pagar com
        <Controller
          control={control}
          name="account_id"
          render={({ field }) => (
            <Select
              items={accountItems}
              value={field.value || null}
              onValueChange={(v) => v && field.onChange(v)}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Pagar com">
                <SelectValue placeholder="Escolha a conta" />
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
        <FieldError message={errors.account_id?.message} />
      </div>

      <label className={labelClass}>
        Data do pagamento
        <Input
          type="date"
          className="h-11 text-base"
          aria-invalid={!!errors.date}
          {...register("date")}
        />
        <FieldError message={errors.date?.message} />
      </label>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Pagando..." : "Confirmar pagamento"}
      </Button>
    </form>
  );
}
