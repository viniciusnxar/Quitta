import { describe, expect, it } from "vitest";
import { monthGrid } from "./grid";

describe("monthGrid", () => {
  it("nov/2026 começa no domingo e tem 5 semanas", () => {
    const weeks = monthGrid("2026-11");
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toBe("2026-11-01");
    expect(weeks[4].filter(Boolean).at(-1)).toBe("2026-11-30");
  });

  it("preenche o início com dias de fora e fecha semanas completas", () => {
    expect(monthGrid("2026-02")).toHaveLength(4);
    const may = monthGrid("2026-05"); // 1º de maio de 2026 é sexta
    expect(may[0].slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(may[0][5]).toBe("2026-05-01");
    expect(may.flat()).toHaveLength(may.length * 7);
  });
});
