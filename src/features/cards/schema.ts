import { z } from "zod";
import { PALETTE } from "@/lib/palette";

export const CARD_BRANDS = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
  outro: "Outra",
} as const;

const day = z
  .number({ error: "Informe um dia de 1 a 31." })
  .int("Informe um dia de 1 a 31.")
  .min(1, "Informe um dia de 1 a 31.")
  .max(31, "Informe um dia de 1 a 31.");

export const cardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do cartão.")
    .max(60, "Use até 60 caracteres."),
  issuer: z.string().trim().max(60, "Use até 60 caracteres."),
  brand: z
    .enum(Object.keys(CARD_BRANDS) as [keyof typeof CARD_BRANDS])
    .nullable(),
  last_digits: z
    .string()
    .trim()
    .regex(/^(\d{4})?$/, "Use os 4 últimos dígitos."),
  credit_limit_cents: z
    .number({ error: "Informe o limite." })
    .int()
    .min(0, "O limite não pode ser negativo."),
  closing_day: day,
  due_day: day,
  payment_account_id: z.uuid().nullable(),
  color: z.enum(PALETTE),
});

export type CardInput = z.infer<typeof cardSchema>;
