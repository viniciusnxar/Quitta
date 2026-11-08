import { z } from "zod";

export const installmentSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "Informe a descrição.")
      .max(120, "Use até 120 caracteres."),
    /** total = divide o valor; parcela = valor de cada parcela (compras com juros). */
    mode: z.enum(["total", "parcela"]),
    amount_cents: z
      .number({ error: "Informe o valor." })
      .int()
      .positive("Informe o valor."),
    count: z
      .number({ error: "Informe o número de parcelas." })
      .int("Use um número inteiro.")
      .min(2, "Mínimo de 2 parcelas.")
      .max(420, "Máximo de 420 parcelas."),
    /** Parcela atual, para compra já em andamento (1 = compra nova). */
    start: z.number({ error: "Informe a parcela atual." }).int().min(1),
    first_date: z.iso.date("Informe a data."),
    account_id: z.uuid().nullable(),
    card_id: z.uuid().nullable(),
    category_id: z.uuid().nullable(),
    notes: z.string().trim().max(500, "Use até 500 caracteres."),
  })
  .superRefine((v, ctx) => {
    if (v.start > v.count)
      ctx.addIssue({
        code: "custom",
        path: ["start"],
        message: "A parcela atual passa do total de parcelas.",
      });
    if (!v.account_id === !v.card_id)
      ctx.addIssue({
        code: "custom",
        path: ["account_id"],
        message: "Escolha um cartão ou uma conta.",
      });
    // A última parcela leva a sobra do arredondamento: precisa ficar > 0.
    if (
      v.mode === "total" &&
      Math.round(v.amount_cents / v.count) * (v.count - 1) >= v.amount_cents
    )
      ctx.addIssue({
        code: "custom",
        path: ["amount_cents"],
        message: "Valor pequeno demais para tantas parcelas.",
      });
  });

export type InstallmentInput = z.infer<typeof installmentSchema>;
