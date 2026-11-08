/** Cores que o usuário pode escolher para contas, categorias e tags. */
export const PALETTE = [
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#525252",
] as const;

export type PaletteColor = (typeof PALETTE)[number];
