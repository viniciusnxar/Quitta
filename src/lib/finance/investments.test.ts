import { describe, expect, it } from "vitest";
import {
  annualRate,
  daysBetween,
  project,
  type ProjectionInput,
} from "./investments";
import { iofRate, irRate } from "./tax-rules";

const cdb: ProjectionInput = {
  rate_mode: "pos_cdi",
  rate: 100,
  rate_period: "ano",
  start_date: "2026-01-01",
  tax_exempt: false,
  ir_rate_override: null,
};
const rates = { CDI: 14.9, SELIC: 15, IPCA: 4.8, TR: 1.8 };

describe("annualRate", () => {
  it("100% do CDI rende o próprio CDI", () => {
    expect(annualRate(cdb, rates)).toBeCloseTo(0.149, 6);
  });

  it("110% do CDI rende um pouco mais que 1,1 × CDI", () => {
    const r = annualRate({ ...cdb, rate: 110 }, rates)!;
    expect(r).toBeGreaterThan(0.149);
    expect(r).toBeCloseTo(0.1648, 3);
  });

  it("prefixado ao mês capitaliza 12 vezes", () => {
    expect(
      annualRate(
        { ...cdb, rate_mode: "prefixado", rate: 1, rate_period: "mes" },
        rates,
      ),
    ).toBeCloseTo(0.126825, 5);
  });

  it("IPCA + spread compõe as duas taxas", () => {
    expect(
      annualRate({ ...cdb, rate_mode: "ipca_mais", rate: 6 }, rates),
    ).toBeCloseTo(1.048 * 1.06 - 1, 10);
  });

  it("poupança: Selic alta = 0,5% a.m. + TR; baixa = 70% da Selic + TR", () => {
    const high = annualRate({ ...cdb, rate_mode: "poupanca" }, rates)!;
    const trM = 1.018 ** (1 / 12) - 1;
    expect(high).toBeCloseTo((1.005 + trM) ** 12 - 1, 10);
    const low = annualRate(
      { ...cdb, rate_mode: "poupanca" },
      { SELIC: 8, TR: 0 },
    )!;
    expect(low).toBeCloseTo(0.056, 10);
  });

  it("sem referência ou variável: null", () => {
    expect(annualRate(cdb, {})).toBeNull();
    expect(annualRate({ ...cdb, rate_mode: "variavel" }, rates)).toBeNull();
  });
});

describe("tax-rules", () => {
  it("IR regressivo nas faixas", () => {
    expect([180, 181, 360, 361, 720, 721].map(irRate)).toEqual([
      22.5, 20, 20, 17.5, 17.5, 15,
    ]);
  });

  it("IOF só até o 29º dia", () => {
    expect([1, 29, 30, 0].map(iofRate)).toEqual([96, 3, 0, 0]);
  });
});

describe("project", () => {
  it("12% a.a. em 1 ano sobre R$ 10.000, aplicado há 2 anos: IR 15%", () => {
    const p = project(
      { ...cdb, rate_mode: "prefixado", rate: 12, start_date: "2024-11-08" },
      0.12,
      10_000_00,
      12,
      "2026-11-08",
    );
    expect(p).toMatchObject({
      grossCents: 1_200_00,
      irRate: 15,
      irCents: 180_00,
      netCents: 1_020_00,
      finalCents: 11_020_00,
    });
  });

  it("isento e poupança não pagam IR", () => {
    const p = project(
      { ...cdb, tax_exempt: true },
      0.12,
      10_000_00,
      12,
      "2026-01-01",
    );
    expect(p.irCents).toBe(0);
    expect(p.netCents).toBe(p.grossCents);
  });

  it("aplicação nova: IOF nos primeiros dias e IR de 22,5%", () => {
    const p = project(
      { ...cdb, start_date: "2026-11-01" },
      0.12,
      10_000_00,
      0,
      "2026-11-08",
    );
    expect(p.grossCents).toBe(0);
    const m = project(
      { ...cdb, start_date: "2026-11-01" },
      0.12,
      10_000_00,
      1,
      "2026-11-08",
    );
    expect(m.irRate).toBe(22.5);
    expect(daysBetween("2026-11-01", m.end)).toBe(37);
    expect(m.iofCents).toBe(0);
  });

  it("alíquota fixa substitui a tabela", () => {
    const p = project(
      { ...cdb, ir_rate_override: 10 },
      0.12,
      10_000_00,
      12,
      "2026-01-01",
    );
    expect(p.irRate).toBe(10);
  });
});
