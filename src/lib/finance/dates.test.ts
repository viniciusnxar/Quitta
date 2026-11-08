import { describe, expect, test } from "vitest";
import {
  addMonths,
  currentMonth,
  formatDate,
  formatMonth,
  isMonth,
  monthBounds,
  shiftMonth,
  today,
} from "./dates";

describe("dates", () => {
  test("today usa o fuso de São Paulo", () => {
    // 02:00 UTC de 1º/dez = 23:00 de 30/nov em São Paulo
    const now = new Date("2026-12-01T02:00:00Z");
    expect(today(now)).toBe("2026-11-30");
    expect(currentMonth(now)).toBe("2026-11");
  });

  test("addMonths limita ao fim do mês, como o Postgres", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });

  test("shiftMonth atravessa anos", () => {
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-03", -15)).toBe("2024-12");
    expect(shiftMonth("2026-03", 24)).toBe("2028-03");
  });

  test("monthBounds respeita bissexto", () => {
    expect(monthBounds("2026-02")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
    expect(monthBounds("2028-02").end).toBe("2028-02-29");
    expect(monthBounds("2026-12").end).toBe("2026-12-31");
  });

  test("isMonth", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("2026-1")).toBe(false);
    expect(isMonth(null)).toBe(false);
  });

  test("formatação pt-BR", () => {
    expect(formatDate("2026-11-08")).toBe("08/11/2026");
    expect(formatDate("2026-01-01", "d 'de' MMM")).toBe("1 de jan");
    expect(formatMonth("2026-11")).toBe("Novembro 2026");
    expect(formatMonth("2027-03")).toBe("Março 2027");
  });
});
