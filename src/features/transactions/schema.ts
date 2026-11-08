import { z } from "zod";

export const FORM_TYPES = ["despesa", "receita", "transferencia"] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const TYPE_LABELS: Record<FormType, string> = {
  despesa: "Despesa",
  receita: "Receita",
  transferencia: "Transferência",
};

export const transactionSchema = z
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
    date: z.iso.date("Informe a data."),
    status: z.enum(["previsto", "pago"]),
    account_id: z.uuid().nullable(),
    card_id: z.uuid().nullable(),
    to_account_id: z.uuid().nullable(),
    category_id: z.uuid().nullable(),
    tag_ids: z.array(z.uuid()),
    notes: z.string().trim().max(500, "Use até 500 caracteres."),
  })
  // Espelha a constraint transactions_shape do banco, com mensagens em pt-BR.
  .superRefine((t, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (t.type === "transferencia") {
      if (!t.account_id) issue("account_id", "Escolha a conta de origem.");
      if (!t.to_account_id)
        issue("to_account_id", "Escolha a conta de destino.");
      if (t.account_id && t.account_id === t.to_account_id)
        issue("to_account_id", "Origem e destino devem ser diferentes.");
      if (t.card_id) issue("account_id", "Transferência não usa cartão.");
    } else {
      if (!t.account_id === !t.card_id)
        issue("account_id", "Escolha uma conta ou um cartão.");
      if (t.to_account_id)
        issue("to_account_id", "Só transferências têm destino.");
    }
  });

export type TransactionInput = z.infer<typeof transactionSchema>;
