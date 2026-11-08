import { addMonths } from "@/lib/finance/dates";

/**
 * Espelha `create_installment_plan` para a prévia: datas mensais a partir de
 * first_date (parcela `start`); no modo total, a última parcela leva a sobra dos centavos.
 */
export function previewInstallments({
  mode,
  amountCents,
  count,
  start,
  firstDate,
}: {
  mode: "total" | "parcela";
  amountCents: number;
  count: number;
  start: number;
  firstDate: string;
}) {
  const inst =
    mode === "parcela" ? amountCents : Math.round(amountCents / count);
  const totalCents = mode === "parcela" ? amountCents * count : amountCents;
  const rows: { number: number; date: string; cents: number }[] = [];
  for (let n = start; n <= count; n++) {
    rows.push({
      number: n,
      date: addMonths(firstDate, n - start),
      cents:
        mode === "total" && n === count
          ? totalCents - inst * (count - 1)
          : inst,
    });
  }
  return { installmentCents: inst, totalCents, rows };
}
