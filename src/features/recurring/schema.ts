import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";
import { FORM_TYPES } from "@/features/transactions/schema";

export const recurringSchema = z
  .object({
    type: z.enum(FORM_TYPES),
    description: z
      .string()
      .trim()
      .min(1, "Informe a descrição.")
      .max(140, "Use até 140 caracteres."),
    amount_cents: z
      .number({ error: "Informe o valor." })
      .int()
      .positive("Informe o valor."),
    cycle: z.enum(Constants.public.Enums.billing_cycle),
    /** 1ª ocorrência: âncora do ciclo. */
    start_date: z.iso.date("Informe a data."),
    end_date: z.iso.date().nullable(),
    account_id: z.uuid().nullable(),
    card_id: z.uuid().nullable(),
    to_account_id: z.uuid().nullable(),
    category_id: z.uuid().nullable(),
    auto_confirm: z.boolean(),
  })
  // Espelha o check de recurring_rules, com mensagens em pt-BR.
  .superRefine((r, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (r.type === "transferencia") {
      if (!r.account_id) issue("account_id", "Escolha a conta de origem.");
      if (!r.to_account_id)
        issue("to_account_id", "Escolha a conta de destino.");
      if (r.account_id && r.account_id === r.to_account_id)
        issue("to_account_id", "Origem e destino devem ser diferentes.");
      if (r.card_id) issue("account_id", "Transferência não usa cartão.");
    } else {
      if (!r.account_id === !r.card_id)
        issue("account_id", "Escolha uma conta ou um cartão.");
      if (r.to_account_id)
        issue("to_account_id", "Só transferências têm destino.");
    }
    if (r.end_date && r.end_date < r.start_date)
      issue("end_date", "Termina antes de começar.");
  });

export type RecurringInput = z.infer<typeof recurringSchema>;
