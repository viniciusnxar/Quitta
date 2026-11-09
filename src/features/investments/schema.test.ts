import { describe, expect, it } from "vitest";
import {
  investmentSchema,
  movementSchema,
  rateText,
  type InvestmentInput,
} from "./schema";

const cdb: InvestmentInput = {
  name: "CDB Banco X",
  kind: "cdb",
  institution: "",
  account_id: null,
  rate_mode: "pos_cdi",
  rate: 110,
  rate_period: "ano",
  start_date: "2026-01-10",
  maturity_date: "2028-01-10",
  liquidity: "no_vencimento",
  liquidity_days: null,
  tax_exempt: false,
  ir_rate_override: null,
  status: "ativo",
  notes: "",
};
const paths = (v: InvestmentInput) =>
  investmentSchema.safeParse(v).error?.issues.map((i) => i.path[0]) ?? [];

describe("investmentSchema", () => {
  it("aceita CDB % do CDI", () => expect(paths(cdb)).toEqual([]));

  it("exige taxa nos modos com taxa, mas não em variável", () => {
    expect(paths({ ...cdb, rate: null })).toEqual(["rate"]);
    expect(paths({ ...cdb, rate_mode: "variavel", rate: null })).toEqual([]);
  });

  it("vencimento não pode ser antes da aplicação; D+N pede os dias", () => {
    expect(paths({ ...cdb, maturity_date: "2025-12-01" })).toEqual([
      "maturity_date",
    ]);
    expect(paths({ ...cdb, liquidity: "d_mais_n" })).toEqual([
      "liquidity_days",
    ]);
  });
});

describe("movementSchema", () => {
  const base = {
    kind: "aporte" as const,
    date: "2026-11-08",
    amount_cents: 100_00,
    account_id: "8f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
    notes: "",
  };
  it("conta só em aporte/resgate", () => {
    expect(movementSchema.safeParse(base).success).toBe(true);
    expect(
      movementSchema.safeParse({ ...base, kind: "rendimento" }).success,
    ).toBe(false);
  });
});

describe("rateText", () => {
  it("descreve a taxa por modo", () => {
    expect(
      rateText({ rate: 110, rate_mode: "pos_cdi", rate_period: "ano" }),
    ).toBe("110% do CDI");
    expect(
      rateText({ rate: 6.5, rate_mode: "ipca_mais", rate_period: "ano" }),
    ).toBe("IPCA + 6,5%");
    expect(
      rateText({ rate: 1, rate_mode: "prefixado", rate_period: "mes" }),
    ).toBe("1% a.m.");
    expect(
      rateText({ rate: null, rate_mode: "variavel", rate_period: "ano" }),
    ).toBe("Variável (sem projeção)");
  });
});
