import { describe, expect, test } from "vitest";
import {
  formatBRL,
  formatCentsInput,
  fromCents,
  parseCentsInput,
  toCents,
} from "./money";

// Intl usa espaço não separável entre "R$" e o número.
const norm = (s: string) => s.replace(/\s/g, " ");

describe("money", () => {
  test("formatBRL", () => {
    expect(norm(formatBRL(1234.5))).toBe("R$ 1.234,50");
    expect(norm(formatBRL(0))).toBe("R$ 0,00");
    expect(norm(formatBRL(-10))).toBe("-R$ 10,00");
  });

  test("centavos sem erro de float", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.99)).toBe(1999);
    expect(fromCents(toCents(0.1) + toCents(0.2))).toBe(0.3);
  });

  test("máscara do input", () => {
    expect(parseCentsInput("")).toBeNull();
    expect(parseCentsInput("0,00")).toBeNull();
    expect(parseCentsInput("1")).toBe(1);
    expect(parseCentsInput("1.234,56")).toBe(123456);
    expect(parseCentsInput("12,345")).toBe(12345); // dígito extra desloca
    expect(parseCentsInput("abc")).toBeNull();
    expect(parseCentsInput("9".repeat(20))).toBe(99999999999999);
    expect(formatCentsInput(123456)).toBe("1.234,56");
    expect(formatCentsInput(5)).toBe("0,05");
  });
});
