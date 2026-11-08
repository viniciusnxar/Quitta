import type { InvoiceStatus } from "./queries";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  aberta: "Aberta",
  fechada: "Fechada",
  vencida: "Vencida",
  paga: "Paga",
};

/**
 * Fatura mostrada: a do mês pedido na URL; senão a primeira aberta
 * (a que recebe as compras de hoje); senão a mais recente.
 */
export function pickInvoice<T extends { month: string; status: string }>(
  invoices: T[],
  requested: string | null,
): T | undefined {
  return (
    invoices.find((i) => i.month === requested) ??
    invoices.find((i) => i.status === "aberta") ??
    invoices.at(-1)
  );
}
