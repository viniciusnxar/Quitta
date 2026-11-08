import { z } from "zod";
import { getProvider } from "@/lib/catalog/subscriptions";
import { Constants } from "@/lib/supabase/database.types";

export type Cycle = (typeof Constants.public.Enums.billing_cycle)[number];

export const CYCLE_LABELS: Record<Cycle, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export const subscriptionSchema = z
  .object({
    /** Slug do catálogo; null = serviço fora do catálogo. */
    provider: z
      .string()
      .nullable()
      .refine((p) => p === null || !!getProvider(p), "Serviço inválido."),
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(60, "Use até 60 caracteres."),
    amount_cents: z
      .number({ error: "Informe o valor." })
      .int()
      .positive("Informe o valor."),
    cycle: z.enum(Constants.public.Enums.billing_cycle),
    /** Data de uma cobrança: âncora do ciclo. */
    start_date: z.iso.date("Informe a data."),
    account_id: z.uuid().nullable(),
    card_id: z.uuid().nullable(),
    category_id: z.uuid().nullable(),
  })
  .refine((v) => !v.account_id !== !v.card_id, {
    path: ["account_id"],
    message: "Escolha um cartão ou uma conta.",
  });

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
