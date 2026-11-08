import { describe, expect, it } from "vitest";
import { financingSchema, parseRate, type FinancingInput } from "./schema";

const base: FinancingInput = {
  name: "Apartamento",
  kind: "imovel",
  institution: "",
  financed_cents: 30000000,
  down_payment_cents: 0,
  interest_rate: 0.9,
  rate_period: "mes",
  system: "sac",
  term_months: 360,
  first_due_date: "2026-12-10",
  monthly_fees_cents: 0,
  paid_installments_before: 0,
  account_id: "00000000-0000-4000-8000-000000000001",
  category_id: null,
};

const ok = (v: Partial<FinancingInput>) =>
  financingSchema.safeParse({ ...base, ...v }).success;

describe("financingSchema", () => {
  it("aceita um financiamento válido", () => expect(ok({})).toBe(true));

  it("parcelas já pagas não passam do prazo", () => {
    expect(ok({ paid_installments_before: 360 })).toBe(true);
    expect(ok({ paid_installments_before: 361 })).toBe(false);
  });

  it("taxa zero só no sistema sem juros", () => {
    expect(ok({ interest_rate: 0 })).toBe(false);
    expect(ok({ interest_rate: 0, system: "sem_juros" })).toBe(true);
  });
});

describe("parseRate", () => {
  it("aceita vírgula e ponto", () => {
    expect(parseRate("1,25")).toBe(1.25);
    expect(parseRate("12.5")).toBe(12.5);
    expect(parseRate("")).toBeNaN();
  });
});
