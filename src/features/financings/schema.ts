import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";

type Enums = typeof Constants.public.Enums;

export const FINANCING_KIND_LABELS: Record<
  Enums["financing_kind"][number],
  string
> = {
  imovel: "Imóvel",
  veiculo: "Veículo",
  pessoal: "Empréstimo pessoal",
  consignado: "Consignado",
  estudantil: "Estudantil",
  outro: "Outro",
};

export const SYSTEM_LABELS: Record<
  Enums["amortization_system"][number],
  string
> = {
  price: "PRICE (parcela fixa)",
  sac: "SAC (parcela decrescente)",
  sem_juros: "Sem juros",
};

export const RATE_PERIOD_LABELS: Record<Enums["rate_period"][number], string> =
  {
    mes: "ao mês",
    ano: "ao ano",
  };

const cents = (msg: string) =>
  z.number({ error: msg }).int().min(0, "Não pode ser negativo.");

export const financingSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(60, "Use até 60 caracteres."),
    kind: z.enum(Constants.public.Enums.financing_kind),
    institution: z.string().trim().max(60, "Use até 60 caracteres."),
    financed_cents: cents("Informe o valor financiado").positive(
      "Informe o valor financiado.",
    ),
    down_payment_cents: cents("Informe a entrada."),
    /** Em %, no período de rate_period. */
    interest_rate: z
      .number({ error: "Informe a taxa (use 0 se não houver)." })
      .min(0, "A taxa não pode ser negativa.")
      .max(100, "Taxa alta demais; confira o valor em %."),
    rate_period: z.enum(Constants.public.Enums.rate_period),
    system: z.enum(Constants.public.Enums.amortization_system),
    term_months: z
      .number({ error: "Informe o prazo." })
      .int("Use um número inteiro.")
      .min(1, "Prazo mínimo de 1 mês.")
      .max(480, "Prazo máximo de 480 meses."),
    first_due_date: z.iso.date("Informe a data."),
    monthly_fees_cents: cents("Informe as taxas (ou 0)."),
    paid_installments_before: z
      .number({ error: "Informe quantas já pagou (ou 0)." })
      .int()
      .min(0),
    account_id: z.uuid("Escolha a conta de débito."),
    category_id: z.uuid().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.paid_installments_before > v.term_months)
      ctx.addIssue({
        code: "custom",
        path: ["paid_installments_before"],
        message: "Passa do prazo total.",
      });
    if (v.system !== "sem_juros" && v.interest_rate === 0)
      ctx.addIssue({
        code: "custom",
        path: ["interest_rate"],
        message: 'Sem taxa? Escolha o sistema "Sem juros".',
      });
  });

export type FinancingInput = z.infer<typeof financingSchema>;

/** "1,25" ou "1.25" → 1.25; vazio → NaN (o zod acusa). */
export function parseRate(value: unknown): number {
  const text = String(value ?? "")
    .trim()
    .replace(",", ".");
  return text === "" ? NaN : Number(text);
}
