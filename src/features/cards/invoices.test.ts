import { describe, expect, it } from "vitest";
import { pickInvoice } from "./invoices";

const invoices = [
  { month: "2026-10", status: "paga" },
  { month: "2026-11", status: "fechada" },
  { month: "2026-12", status: "aberta" },
  { month: "2027-01", status: "aberta" },
];

describe("pickInvoice", () => {
  it("usa o mês pedido quando existe", () => {
    expect(pickInvoice(invoices, "2026-10")?.month).toBe("2026-10");
  });

  it("senão, a primeira aberta", () => {
    expect(pickInvoice(invoices, null)?.month).toBe("2026-12");
    expect(pickInvoice(invoices, "1999-01")?.month).toBe("2026-12");
  });

  it("sem abertas, a mais recente; sem faturas, nada", () => {
    expect(pickInvoice(invoices.slice(0, 2), null)?.month).toBe("2026-11");
    expect(pickInvoice([], null)).toBeUndefined();
  });
});
