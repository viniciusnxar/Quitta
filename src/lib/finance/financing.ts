import { addMonths } from "./dates";

export type ExtraStrategy = "reduzir_prazo" | "reduzir_parcela";
export const EXTRA_STRATEGIES = ["reduzir_prazo", "reduzir_parcela"] as const;

export type ScheduleParams = {
  financedCents: number;
  /** Em %, no período de ratePeriod. */
  interestRate: number;
  ratePeriod: "mes" | "ano";
  system: "price" | "sac" | "sem_juros";
  termMonths: number;
  firstDueDate: string;
  feesCents: number;
};

export type Extra = { date: string; cents: number; strategy: ExtraStrategy };

export type ScheduleRow = {
  number: number;
  dueDate: string;
  amortization: number;
  interest: number;
  total: number;
  balanceAfter: number;
};

/** Taxa mensal decimal: 12% a.a. → (1,12)^(1/12) − 1. */
export function monthlyRate(p: ScheduleParams): number {
  if (p.system === "sem_juros" || p.interestRate === 0) return 0;
  const r = p.interestRate / 100;
  return p.ratePeriod === "ano" ? (1 + r) ** (1 / 12) - 1 : r;
}

const payment = (bal: number, i: number, n: number) =>
  i === 0 ? bal / n : (bal * i) / (1 - (1 + i) ** -n);

/**
 * Espelha `generate_financing_schedule` (em centavos): cada amortização extra
 * vale na parcela cujo vencimento é o primeiro ≥ à data dela.
 */
export function buildSchedule(p: ScheduleParams, extras: Extra[] = []) {
  const i = monthlyRate(p);
  const sorted = [...extras].sort((a, b) => a.date.localeCompare(b.date));
  let bal = p.financedCents;
  let pmt = payment(bal, i, p.termMonths);
  let amortFixed = bal / p.termMonths;
  let prevDue: string | null = null;
  const rows: ScheduleRow[] = [];

  for (let num = 1; num <= p.termMonths; num++) {
    const due = addMonths(p.firstDueDate, num - 1);
    const rem = p.termMonths - num + 1;
    for (const e of sorted) {
      if ((prevDue !== null && e.date <= prevDue) || e.date > due) continue;
      bal = Math.max(bal - e.cents, 0);
      if (e.strategy === "reduzir_parcela" && bal > 0) {
        pmt = payment(bal, i, rem);
        amortFixed = bal / rem;
      }
    }
    prevDue = due;
    if (bal <= 0) break;

    const interest = Math.round(bal * i);
    let amortization =
      p.system === "sac" ? Math.round(amortFixed) : Math.round(pmt - interest);
    if (amortization > bal || num === p.termMonths) amortization = bal;
    bal -= amortization;
    rows.push({
      number: num,
      dueDate: due,
      amortization,
      interest,
      total: amortization + interest + p.feesCents,
      balanceAfter: bal,
    });
  }
  return rows;
}

/** Efeito de uma amortização extra a mais sobre o cronograma atual. */
export function simulateExtra(
  p: ScheduleParams,
  extras: Extra[],
  extra: Extra,
) {
  const before = buildSchedule(p, extras);
  const after = buildSchedule(p, [...extras, extra]);
  const sum = (rows: ScheduleRow[]) => rows.reduce((s, r) => s + r.interest, 0);
  const next = after.find((r) => r.dueDate >= extra.date);
  const prevNext = before.find((r) => r.dueDate >= extra.date);
  return {
    interestSavedCents: sum(before) - sum(after),
    monthsSaved: before.length - after.length,
    installmentBefore: prevNext?.total ?? 0,
    installmentAfter: next?.total ?? 0,
    lastDueDate: after.at(-1)?.dueDate ?? null,
  };
}
