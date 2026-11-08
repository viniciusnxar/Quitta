// Valores do banco chegam em reais (numeric(14,2) → number). Contas no TS: centavos inteiros.

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor em reais: 1234.5 → "R$ 1.234,50". */
export function formatBRL(reais: number): string {
  return brl.format(reais);
}

export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Formata centavos sem o "R$": 123456 → "1.234,56". */
export function formatCentsInput(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Máscara estilo caixa eletrônico: só os dígitos contam, os 2 últimos são centavos.
 * "1.234,5" → 12345 · "" → null. Limite de numeric(14,2): 12 dígitos inteiros.
 */
export function parseCentsInput(text: string): number | null {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, 14);
  return digits ? Number(digits) : null;
}
