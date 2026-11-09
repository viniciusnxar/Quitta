// ⚠️ Regras tributárias mudam: confira a legislação vigente antes de publicar.

/** IR regressivo da renda fixa: [até N dias, alíquota %]. */
export const IR_TABLE: readonly [maxDays: number, rate: number][] = [
  [180, 22.5],
  [360, 20],
  [720, 17.5],
  [Infinity, 15],
];

/** Alíquota de IR (%) pelos dias corridos desde a aplicação. */
export function irRate(days: number): number {
  return IR_TABLE.find(([max]) => days <= max)![1];
}

/** IOF regressivo (% do rendimento) do 1º ao 29º dia; a partir do 30º, zero. */
const IOF_TABLE = [
  96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36,
  33, 30, 26, 23, 20, 16, 13, 10, 6, 3,
];

export function iofRate(days: number): number {
  return days >= 1 && days <= IOF_TABLE.length ? IOF_TABLE[days - 1] : 0;
}

/** Poupança: acima desta Selic (% a.a.) rende 0,5% a.m. + TR. */
export const POUPANCA_SELIC_THRESHOLD = 8.5;
