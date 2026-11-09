import { describe, expect, it } from "vitest";
import { recurringSchema, type RecurringInput } from "./schema";

const salary: RecurringInput = {
  type: "receita",
  description: "Salário",
  amount_cents: 500_000,
  cycle: "mensal",
  start_date: "2026-11-05",
  end_date: null,
  account_id: "8f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  card_id: null,
  to_account_id: null,
  category_id: null,
  auto_confirm: true,
};
const issues = (v: RecurringInput) =>
  recurringSchema.safeParse(v).error?.issues.map((i) => i.path[0]) ?? [];

describe("recurringSchema", () => {
  it("aceita salário mensal em conta", () => {
    expect(issues(salary)).toEqual([]);
  });

  it("exige exatamente uma conta ou cartão", () => {
    expect(issues({ ...salary, account_id: null })).toEqual(["account_id"]);
  });

  it("transferência precisa de destino diferente da origem", () => {
    const t = { ...salary, type: "transferencia" as const };
    expect(issues(t)).toEqual(["to_account_id"]);
    expect(issues({ ...t, to_account_id: salary.account_id })).toEqual([
      "to_account_id",
    ]);
  });

  it("fim não pode ser antes do início", () => {
    expect(issues({ ...salary, end_date: "2026-11-01" })).toEqual(["end_date"]);
  });
});
