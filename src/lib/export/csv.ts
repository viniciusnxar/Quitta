/** Célula: texto, número (vira "1234,56") ou vazio. */
export type Cell = string | number | null | undefined;

const BOM = String.fromCharCode(0xfeff);

function cell(v: Cell): string {
  if (v == null) return "";
  if (typeof v === "number") return v.toFixed(2).replace(".", ",");
  // Evita fórmula ao abrir no Excel (CSV injection).
  const text = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV que abre certo no Excel BR: `;`, vírgula decimal e BOM UTF-8. */
export function toCsv(rows: Cell[][]): string {
  return BOM + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}
