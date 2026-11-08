import { describe, expect, it } from "vitest";
import { groupByDay } from "./group";

const t = (date: string, type: string, amount: number, status = "pago") => ({
  date,
  type,
  amount,
  status,
});

describe("groupByDay", () => {
  it("agrupa por data e soma receitas menos despesas", () => {
    const days = groupByDay([
      t("2026-11-08", "receita", 100.1),
      t("2026-11-08", "despesa", 30.2),
      t("2026-11-08", "transferencia", 50),
      t("2026-11-08", "despesa", 999, "cancelado"),
      t("2026-11-07", "despesa", 10),
    ]);
    expect(days.map((d) => [d.date, d.items.length, d.totalCents])).toEqual([
      ["2026-11-08", 4, 6990],
      ["2026-11-07", 1, -1000],
    ]);
  });
});
