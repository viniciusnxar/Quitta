import { describe, expect, it } from "vitest";
import { previewInstallments } from "./preview";

describe("previewInstallments", () => {
  it("divide o total e põe a sobra na última parcela", () => {
    const p = previewInstallments({
      mode: "total",
      amountCents: 10000,
      count: 3,
      start: 1,
      firstDate: "2026-01-31",
    });
    expect(p.installmentCents).toBe(3333);
    expect(p.rows.map((r) => [r.number, r.date, r.cents])).toEqual([
      [1, "2026-01-31", 3333],
      [2, "2026-02-28", 3333],
      [3, "2026-03-31", 3334],
    ]);
  });

  it("valor da parcela: total = parcela × quantidade", () => {
    const p = previewInstallments({
      mode: "parcela",
      amountCents: 5000,
      count: 12,
      start: 1,
      firstDate: "2026-11-10",
    });
    expect(p.totalCents).toBe(60000);
    expect(p.rows.every((r) => r.cents === 5000)).toBe(true);
  });

  it("compra em andamento gera só da parcela atual em diante", () => {
    const p = previewInstallments({
      mode: "total",
      amountCents: 100000,
      count: 10,
      start: 4,
      firstDate: "2026-11-05",
    });
    expect(p.rows).toHaveLength(7);
    expect(p.rows[0]).toEqual({ number: 4, date: "2026-11-05", cents: 10000 });
    expect(p.rows.at(-1)).toEqual({
      number: 10,
      date: "2027-05-05",
      cents: 10000,
    });
  });
});

describe("installmentSchema", () => {
  it("recusa total que deixaria a última parcela sem valor", async () => {
    const { installmentSchema } = await import("./schema");
    const base = {
      description: "x",
      mode: "total" as const,
      count: 8,
      start: 1,
      first_date: "2026-11-08",
      account_id: "00000000-0000-4000-8000-000000000001",
      card_id: null,
      category_id: null,
      notes: "",
    };
    expect(
      installmentSchema.safeParse({ ...base, amount_cents: 13 }).success,
    ).toBe(false);
    expect(
      installmentSchema.safeParse({ ...base, amount_cents: 80000 }).success,
    ).toBe(true);
  });
});
