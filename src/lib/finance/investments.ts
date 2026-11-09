import { addMonths } from "./dates";
import { iofRate, irRate, POUPANCA_SELIC_THRESHOLD } from "./tax-rules";

export type RateCode = "CDI" | "SELIC" | "IPCA" | "TR";
/** Taxas de referência em % a.a. */
export type Rates = Partial<Record<RateCode, number>>;

export type ProjectionInput = {
  rate_mode:
    | "prefixado"
    | "pos_cdi"
    | "pos_selic"
    | "ipca_mais"
    | "poupanca"
    | "variavel";
  /** Em %; significado depende do modo. */
  rate: number | null;
  rate_period: "mes" | "ano";
  start_date: string;
  tax_exempt: boolean;
  ir_rate_override: number | null;
};

export const PERIODS = [
  { months: 1, label: "Mensal" },
  { months: 3, label: "Trimestral" },
  { months: 6, label: "Semestral" },
  { months: 12, label: "Anual" },
] as const;

const monthly = (annual: number) => (1 + annual) ** (1 / 12) - 1;

/**
 * Taxa anual efetiva (decimal) ou null quando não dá para projetar
 * (variável, ou falta a taxa de referência).
 */
export function annualRate(p: ProjectionInput, rates: Rates): number | null {
  const r = (p.rate ?? 0) / 100;
  const ref = (code: RateCode) =>
    rates[code] === undefined ? null : rates[code] / 100;
  switch (p.rate_mode) {
    case "prefixado":
      return p.rate_period === "mes" ? (1 + r) ** 12 - 1 : r;
    case "pos_cdi": {
      const cdi = ref("CDI");
      if (cdi === null) return null;
      const daily = (1 + cdi) ** (1 / 252) - 1;
      return (1 + daily * r) ** 252 - 1;
    }
    case "pos_selic": {
      const selic = ref("SELIC");
      return selic === null ? null : (1 + selic) * (1 + r) - 1;
    }
    case "ipca_mais": {
      const ipca = ref("IPCA");
      return ipca === null ? null : (1 + ipca) * (1 + r) - 1;
    }
    case "poupanca": {
      const selic = ref("SELIC");
      if (selic === null) return null;
      const tr = monthly(ref("TR") ?? 0);
      const base =
        selic * 100 > POUPANCA_SELIC_THRESHOLD ? 0.005 : monthly(selic * 0.7);
      return (1 + base + tr) ** 12 - 1;
    }
    case "variavel":
      return null;
  }
}

/** Dias corridos entre duas datas "YYYY-MM-DD". */
export function daysBetween(from: string, to: string): number {
  const utc = (d: string) =>
    Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/**
 * Rendimento de `positionCents` em `months` meses a partir de `from`, com IOF e IR
 * calculados pelos dias desde a aplicação até o fim do período (como num resgate ali).
 */
export function project(
  p: ProjectionInput,
  annual: number,
  positionCents: number,
  months: number,
  from: string,
) {
  const end = addMonths(from, months);
  const days = Math.max(daysBetween(p.start_date, end), 0);
  const gross = Math.round(positionCents * ((1 + annual) ** (months / 12) - 1));
  const exempt = p.tax_exempt || p.rate_mode === "poupanca";
  const iof = exempt ? 0 : Math.round((gross * iofRate(days)) / 100);
  const taxRate = exempt ? 0 : (p.ir_rate_override ?? irRate(days));
  const ir = Math.round(((gross - iof) * taxRate) / 100);
  const net = gross - iof - ir;
  return {
    end,
    grossCents: gross,
    iofCents: iof,
    irRate: taxRate,
    irCents: ir,
    netCents: net,
    finalCents: positionCents + net,
  };
}
