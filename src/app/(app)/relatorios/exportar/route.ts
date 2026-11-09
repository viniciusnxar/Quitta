import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { listCategories } from "@/features/categories/queries";
import { listFinancings } from "@/features/financings/queries";
import { listInstallmentPlans } from "@/features/installments/queries";
import { byCategory, bySource } from "@/features/reports/aggregate";
import {
  listMonthTransactions,
  toReportTx,
  type MonthTransaction,
} from "@/features/reports/queries";
import { CYCLE_LABELS } from "@/features/subscriptions/schema";
import { listSubscriptions } from "@/features/subscriptions/queries";
import { toCsv, type Cell } from "@/lib/export/csv";
import { currentMonth, isMonth } from "@/lib/finance/dates";
import { fromCents } from "@/lib/finance/money";

const TYPE_LABELS: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  transferencia: "Transferência",
  pagamento_fatura: "Pagamento de fatura",
  aplicacao: "Aplicação",
  resgate: "Resgate",
};
const STATUS_LABELS: Record<string, string> = {
  pago: "Pago",
  previsto: "Previsto",
};

const TX_HEADER = [
  "Data",
  "Descrição",
  "Tipo",
  "Status",
  "Valor",
  "Conta",
  "Destino",
  "Cartão",
  "Categoria",
  "Tags",
  "Observações",
];
const txRow = (t: MonthTransaction): Cell[] => [
  t.date,
  t.description,
  TYPE_LABELS[t.type] ?? t.type,
  STATUS_LABELS[t.status] ?? t.status,
  t.amount,
  t.account?.name,
  t.to_account?.name,
  t.card?.name,
  t.category?.name,
  t.tags.join(", "),
  t.notes,
];

/** GET ?formato=xlsx|csv&mes=YYYY-MM — transações do mês e resumos. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const format = params.get("formato") === "csv" ? "csv" : "xlsx";
  const raw = params.get("mes");
  const month = isMonth(raw) ? raw : currentMonth();
  const txs = await listMonthTransactions(month);
  const name = `quitta-${month}`;

  if (format === "csv")
    return new Response(toCsv([TX_HEADER, ...txs.map(txRow)]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}.csv"`,
      },
    });

  const [categories, plans, subscriptions, financings] = await Promise.all([
    listCategories(),
    listInstallmentPlans(),
    listSubscriptions(),
    listFinancings(),
  ]);
  const report = txs.map(toReportTx);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Quitta";
  const sheet = (
    title: string,
    header: string[],
    rows: Cell[][],
    moneyCols: number[],
  ) => {
    const ws = wb.addWorksheet(title);
    ws.addRow(header).font = { bold: true };
    for (const r of rows) ws.addRow(r.map((c) => c ?? null));
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.columns.forEach((col, i) => {
      col.width = Math.min(
        Math.max(
          header[i].length,
          ...rows.map((r) => String(r[i] ?? "").length),
        ) + 2,
        48,
      );
      if (moneyCols.includes(i)) col.numFmt = '"R$" #,##0.00';
    });
  };

  sheet("Transações", TX_HEADER, txs.map(txRow), [4]);
  sheet(
    "Por categoria",
    ["Categoria", "Subcategoria", "Total"],
    byCategory(report, categories).flatMap((g) => [
      [g.name, null, fromCents(g.cents)],
      ...g.children.map((c) => [g.name, c.name, fromCents(c.cents)]),
    ]),
    [2],
  );
  sheet(
    "Por conta",
    ["Conta / cartão", "Despesas"],
    bySource(report).map((s) => [s.name, fromCents(s.cents)]),
    [1],
  );
  sheet(
    "Parcelamentos",
    ["Descrição", "Total", "Parcela", "Parcelas", "Pagas", "Falta", "Próxima"],
    plans.map((p) => [
      p.description,
      p.total_amount,
      p.installment_amount,
      p.installment_count,
      p.paid_installments,
      p.remaining_amount,
      p.next_date,
    ]),
    [1, 2, 5],
  );
  sheet(
    "Assinaturas",
    ["Nome", "Valor", "Ciclo", "Por mês", "Por ano", "Status", "Próxima"],
    subscriptions.map((s) => [
      s.name,
      s.amount,
      CYCLE_LABELS[s.cycle],
      s.monthly_equivalent,
      s.yearly_equivalent,
      s.status,
      s.next_charge,
    ]),
    [1, 3, 4],
  );
  sheet(
    "Financiamentos",
    [
      "Nome",
      "Financiado",
      "Saldo devedor",
      "Pagas",
      "Restantes",
      "Próxima",
      "Valor próxima",
    ],
    financings.map((f) => [
      f.name,
      f.financed_amount,
      f.outstanding_balance,
      f.paid_installments,
      f.remaining_installments,
      f.next_due_date,
      f.next_amount,
    ]),
    [1, 2, 6],
  );

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.xlsx"`,
    },
  });
}
