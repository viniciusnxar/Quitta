"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatCentsInput, parseCentsInput } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

type Props = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  /** Valor em centavos; null = vazio. */
  value: number | null;
  onChange: (cents: number | null) => void;
};

/** Campo de valor em BRL com máscara: digitar "1234" mostra "12,34". */
export function MoneyInput({ value, onChange, className, ...props }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
        R$
      </span>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        className={cn("h-11 pl-10 text-base tabular-nums", className)}
        value={value === null ? "" : formatCentsInput(value)}
        onChange={(e) => onChange(parseCentsInput(e.target.value))}
      />
    </div>
  );
}
