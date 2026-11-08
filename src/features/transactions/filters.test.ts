import { describe, expect, it } from "vitest";
import { countFilters, loadFilters } from "./filters";

const ID = "00000000-0000-4000-8000-000000000001";

describe("loadFilters", () => {
  it("aceita valores no formato certo", () => {
    const f = loadFilters(`?conta=${ID}&de=2026-11-01&tipo=despesa&q=mercado`);
    expect(f).toMatchObject({ conta: ID, de: "2026-11-01", tipo: "despesa" });
    expect(countFilters(f)).toBe(3);
  });

  it("descarta o que poderia injetar condições no filtro do PostgREST", () => {
    const f = loadFilters(
      `?conta=${ID},to_account_id.neq.x&de=2026-11-01),or(id.gt.0&tipo=xyz`,
    );
    expect(f).toMatchObject({ conta: null, de: null, tipo: null });
    expect(countFilters(f)).toBe(0);
  });
});
