import { describe, expect, it } from "vitest";
import { resolveBudget, rollupToRoots, type BudgetRow } from "./resolve";

const rows: BudgetRow[] = [
  { id: "g", category_id: null, month: null, amount: 3000 },
  { id: "g11", category_id: null, month: "2026-11-01", amount: 4000 },
  { id: "m", category_id: "mercado", month: null, amount: 800 },
];

describe("resolveBudget", () => {
  it("o valor do mês sobrescreve o padrão", () => {
    expect(resolveBudget(rows, null, "2026-11-01")?.id).toBe("g11");
    expect(resolveBudget(rows, null, "2026-12-01")?.id).toBe("g");
  });

  it("separa global de categoria e devolve null sem limite", () => {
    expect(resolveBudget(rows, "mercado", "2026-11-01")?.id).toBe("m");
    expect(resolveBudget(rows, "lazer", "2026-11-01")).toBeNull();
  });
});

describe("rollupToRoots", () => {
  it("soma subcategorias na principal e ignora sem categoria", () => {
    const totals = rollupToRoots(
      [
        { id: "casa", parent_id: null },
        { id: "luz", parent_id: "casa" },
      ],
      [
        { category_id: "casa", cents: 100 },
        { category_id: "luz", cents: 50 },
        { category_id: null, cents: 999 },
      ],
    );
    expect([...totals]).toEqual([["casa", 150]]);
  });
});
