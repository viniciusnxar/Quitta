import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/export/csv";
import {
  byCategory,
  bySource,
  byTag,
  evolution,
  incomeByNature,
  type CategoryInfo,
  type ReportTx,
} from "./aggregate";

const cats: CategoryInfo[] = [
  { id: "casa", name: "Casa", color: "#111", parent_id: null, nature: "fixa" },
  { id: "luz", name: "Luz", color: null, parent_id: "casa", nature: "fixa" },
  {
    id: "lazer",
    name: "Lazer",
    color: null,
    parent_id: null,
    nature: "variavel",
  },
  {
    id: "sal",
    name: "Salário",
    color: null,
    parent_id: null,
    nature: "salario",
  },
];
const tx = (t: Partial<ReportTx>): ReportTx => ({
  type: "despesa",
  amount: 10,
  category_id: null,
  source: "Conta",
  tags: [],
  ...t,
});
const txs = [
  tx({ category_id: "casa", amount: 100 }),
  tx({ category_id: "luz", amount: 50.1, source: "Nubank", tags: ["viagem"] }),
  tx({ category_id: "lazer", amount: 30, tags: ["viagem", "família"] }),
  tx({ amount: 5 }),
  tx({ type: "receita", category_id: "sal", amount: 5000 }),
  tx({ type: "receita", amount: 20 }),
];

describe("relatórios", () => {
  it("agrupa subcategorias na principal e ordena", () => {
    const groups = byCategory(txs, cats);
    expect(groups.map((g) => [g.key, g.cents])).toEqual([
      ["casa", 150_10],
      ["lazer", 30_00],
      ["none", 5_00],
    ]);
    expect(groups[0].children).toEqual([
      { key: "luz", name: "Luz", cents: 50_10 },
    ]);
  });

  it("soma por conta/cartão e por tag (só despesas)", () => {
    expect(bySource(txs).map((s) => [s.name, s.cents])).toEqual([
      ["Conta", 135_00],
      ["Nubank", 50_10],
    ]);
    expect(byTag(txs).map((s) => [s.name, s.cents])).toEqual([
      ["viagem", 80_10],
      ["família", 30_00],
    ]);
  });

  it("receitas por natureza; sem categoria vira outro", () => {
    expect(
      incomeByNature(txs, cats, { salario: "Salário", outro: "Outro" }),
    ).toEqual([
      { key: "salario", name: "Salário", cents: 5000_00 },
      { key: "outro", name: "Outro", cents: 20_00 },
    ]);
  });

  it("evolução preenche meses sem movimento com zero", () => {
    expect(
      evolution(
        [
          { month: "2026-10-01", type: "despesa", total: 10 },
          { month: "2026-10-01", type: "receita", total: 20 },
        ],
        ["2026-09", "2026-10"],
      ),
    ).toEqual([
      { month: "2026-09", receita: 0, despesa: 0 },
      { month: "2026-10", receita: 20_00, despesa: 10_00 },
    ]);
  });
});

describe("toCsv", () => {
  it("usa ; vírgula decimal, BOM e escapa campos", () => {
    expect(
      toCsv([
        ["Data", "Descrição", "Valor"],
        ["2026-11-08", 'Pão; leite "integral"', 1234.5],
        ["x", "=SOMA(A1)", null],
      ]),
    ).toBe(
      '﻿Data;Descrição;Valor\r\n2026-11-08;"Pão; leite ""integral""";1234,50\r\nx;\'=SOMA(A1);\r\n',
    );
  });
});
