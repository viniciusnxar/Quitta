import { z } from "zod";

export const budgetSchema = z.object({
  /** null = limite global de gastos do mês. */
  category_id: z.uuid().nullable(),
  amount_cents: z
    .number({ error: "Informe o valor." })
    .int()
    .positive("Informe o valor."),
  /** "YYYY-MM": mês que está sendo visto. */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido."),
  /** true = vale para todos os meses; false = só para `month`. */
  every_month: z.boolean(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
