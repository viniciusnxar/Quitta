import { z } from "zod";
import { PALETTE } from "@/lib/palette";
import { Constants } from "@/lib/supabase/database.types";

export const ACCOUNT_TYPE_LABELS: Record<
  (typeof Constants.public.Enums.account_type)[number],
  string
> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  carteira: "Carteira (dinheiro)",
  investimento: "Corretora / investimento",
  beneficio: "Benefício (VR/VA)",
  outro: "Outro",
};

export const ACCOUNT_ICONS = [
  "landmark",
  "wallet",
  "piggy-bank",
  "banknote",
  "smartphone",
  "briefcase",
  "utensils",
  "trending-up",
] as const;

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da conta.")
    .max(60, "Use até 60 caracteres."),
  institution: z.string().trim().max(60, "Use até 60 caracteres."),
  type: z.enum(Constants.public.Enums.account_type),
  // shortcut: só saldo inicial >= 0; aceitar negativo (cheque especial) se alguém pedir.
  initial_balance_cents: z
    .number({ error: "Informe o saldo inicial." })
    .int()
    .min(0),
  initial_balance_date: z.iso.date("Data inválida."),
  color: z.enum(PALETTE),
  icon: z.enum(ACCOUNT_ICONS),
  include_in_total: z.boolean(),
});

export type AccountInput = z.infer<typeof accountSchema>;
