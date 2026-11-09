import { describe, expect, it } from "vitest";
import {
  buildSchedule,
  monthlyRate,
  simulateExtra,
  type ScheduleParams,
} from "./financing";

const base: ScheduleParams = {
  financedCents: 10_000_00,
  interestRate: 1,
  ratePeriod: "mes",
  system: "price",
  termMonths: 12,
  firstDueDate: "2026-01-31",
  feesCents: 0,
};
const sumAmort = (rows: { amortization: number }[]) =>
  rows.reduce((s, r) => s + r.amortization, 0);

describe("buildSchedule", () => {
  it("PRICE: parcela fixa de R$ 888,49 e saldo zerado", () => {
    const rows = buildSchedule(base);
    expect(rows).toHaveLength(12);
    expect(rows[0]).toMatchObject({ interest: 100_00, total: 888_49 });
    expect(rows.slice(0, 11).every((r) => r.total === 888_49)).toBe(true);
    expect(sumAmort(rows)).toBe(base.financedCents);
    expect(rows.at(-1)!.balanceAfter).toBe(0);
  });

  it("vencimentos mensais presos ao fim do mês", () => {
    const rows = buildSchedule(base);
    expect(rows.slice(0, 3).map((r) => r.dueDate)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });

  it("SAC: amortização constante e parcela decrescente", () => {
    const rows = buildSchedule({ ...base, system: "sac" });
    expect(rows[0]).toMatchObject({ amortization: 833_33, interest: 100_00 });
    expect(rows[1].total).toBeLessThan(rows[0].total);
    expect(sumAmort(rows)).toBe(base.financedCents);
  });

  it("sem juros soma taxas mensais", () => {
    const rows = buildSchedule({
      ...base,
      system: "sem_juros",
      feesCents: 10_00,
    });
    expect(rows[0]).toMatchObject({ interest: 0, total: 843_33 });
    expect(sumAmort(rows)).toBe(base.financedCents);
  });

  it("taxa anual vira mensal equivalente", () => {
    expect(
      monthlyRate({ ...base, interestRate: 12.682503, ratePeriod: "ano" }),
    ).toBeCloseTo(0.01, 8);
  });

  it("extra reduzir_prazo encurta o cronograma", () => {
    const rows = buildSchedule(base, [
      { date: "2026-03-15", cents: 3_000_00, strategy: "reduzir_prazo" },
    ]);
    expect(rows.length).toBeLessThan(12);
    expect(rows[2].total).toBe(888_49);
    expect(sumAmort(rows) + 3_000_00).toBe(base.financedCents);
  });

  it("extra reduzir_parcela mantém o prazo com parcela menor", () => {
    const rows = buildSchedule(base, [
      { date: "2026-03-15", cents: 3_000_00, strategy: "reduzir_parcela" },
    ]);
    expect(rows).toHaveLength(12);
    expect(rows[2].total).toBeLessThan(888_49);
    expect(rows.at(-1)!.balanceAfter).toBe(0);
  });

  it("extra que quita o saldo encerra o cronograma", () => {
    const rows = buildSchedule(base, [
      { date: "2026-01-01", cents: 99_999_00, strategy: "reduzir_prazo" },
    ]);
    expect(rows).toHaveLength(0);
  });
});

describe("simulateExtra", () => {
  it("mostra juros economizados e meses a menos", () => {
    const s = simulateExtra(base, [], {
      date: "2026-03-15",
      cents: 3_000_00,
      strategy: "reduzir_prazo",
    });
    expect(s.interestSavedCents).toBeGreaterThan(0);
    expect(s.monthsSaved).toBeGreaterThan(0);
    expect(s.installmentAfter).toBe(s.installmentBefore);
  });
});
