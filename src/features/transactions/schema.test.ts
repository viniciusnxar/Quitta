import { describe, expect, it } from "vitest";
import { transactionSchema, type TransactionInput } from "./schema";

const A = "00000000-0000-4000-8000-000000000001";
const B = "00000000-0000-4000-8000-000000000002";

const base: TransactionInput = {
  type: "despesa",
  description: "Mercado",
  amount_cents: 1050,
  date: "2026-11-08",
  status: "pago",
  account_id: A,
  card_id: null,
  to_account_id: null,
  category_id: null,
  tag_ids: [],
  notes: "",
};

const ok = (t: Partial<TransactionInput>) =>
  transactionSchema.safeParse({ ...base, ...t }).success;

describe("transactionSchema", () => {
  it("despesa precisa de exatamente uma conta ou um cartão", () => {
    expect(ok({})).toBe(true);
    expect(ok({ account_id: null, card_id: B })).toBe(true);
    expect(ok({ account_id: null })).toBe(false);
    expect(ok({ card_id: B })).toBe(false);
  });

  it("transferência precisa de origem e destino diferentes, sem cartão", () => {
    const t = { type: "transferencia" as const };
    expect(ok({ ...t, to_account_id: B })).toBe(true);
    expect(ok({ ...t, to_account_id: A })).toBe(false);
    expect(ok({ ...t })).toBe(false);
    expect(ok({ ...t, to_account_id: B, card_id: B })).toBe(false);
  });

  it("rejeita valor zero e data inválida", () => {
    expect(ok({ amount_cents: 0 })).toBe(false);
    expect(ok({ date: "08/11/2026" })).toBe(false);
  });
});
