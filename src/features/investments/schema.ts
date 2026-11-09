import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";

type Enums = typeof Constants.public.Enums;
export type InvestmentKind = Enums["investment_kind"][number];
export type RateMode = Enums["rate_mode"][number];
export type MovementKind = Enums["investment_movement_kind"][number];

export const INVESTMENT_KIND_LABELS: Record<InvestmentKind, string> = {
  cdb: "CDB",
  lci: "LCI",
  lca: "LCA",
  cri: "CRI",
  cra: "CRA",
  debenture: "Debênture",
  tesouro_selic: "Tesouro Selic",
  tesouro_ipca: "Tesouro IPCA+",
  tesouro_prefixado: "Tesouro Prefixado",
  poupanca: "Poupança",
  fundo: "Fundo",
  acao: "Ações",
  fii: "FII",
  etf: "ETF",
  cripto: "Cripto",
  previdencia: "Previdência",
  outro: "Outro",
};

/** Isentos de IR para pessoa física pela regra atual; o usuário pode mudar. */
export const TAX_EXEMPT_KINDS: InvestmentKind[] = [
  "lci",
  "lca",
  "cri",
  "cra",
  "poupanca",
];

export const RATE_MODE_LABELS: Record<RateMode, string> = {
  pos_cdi: "% do CDI",
  prefixado: "Prefixado",
  ipca_mais: "IPCA +",
  pos_selic: "Selic +",
  poupanca: "Poupança",
  variavel: "Variável (sem projeção)",
};

/** "110% do CDI", "IPCA + 6,5%", "12% a.a." */
export function rateText(i: {
  rate: number | null;
  rate_mode: RateMode;
  rate_period: "mes" | "ano";
}) {
  if (i.rate == null) return RATE_MODE_LABELS[i.rate_mode];
  const r = i.rate.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
  switch (i.rate_mode) {
    case "pos_cdi":
      return `${r}% do CDI`;
    case "ipca_mais":
      return `IPCA + ${r}%`;
    case "pos_selic":
      return `Selic + ${r}%`;
    default:
      return `${r}% ${i.rate_period === "mes" ? "a.m." : "a.a."}`;
  }
}

/** Modos em que o campo de taxa aparece. */
export const RATE_MODES_WITH_RATE: RateMode[] = [
  "pos_cdi",
  "prefixado",
  "ipca_mais",
  "pos_selic",
];

export const LIQUIDITY_LABELS = {
  diaria: "Diária",
  no_vencimento: "No vencimento",
  d_mais_n: "D+N dias",
} as const;

export const MOVEMENT_KIND_LABELS: Record<MovementKind, string> = {
  aporte: "Aporte",
  resgate: "Resgate",
  rendimento: "Rendimento",
  imposto: "Imposto",
  taxa: "Taxa",
  atualizacao: "Atualizar saldo",
};

/** Efeito na posição: + entra, − sai (a atualização substitui o saldo). */
export const MOVEMENT_SIGN: Record<
  Exclude<MovementKind, "atualizacao">,
  1 | -1
> = { aporte: 1, rendimento: 1, resgate: -1, imposto: -1, taxa: -1 };

export const investmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(60, "Use até 60 caracteres."),
    kind: z.enum(Constants.public.Enums.investment_kind),
    institution: z.string().trim().max(60, "Use até 60 caracteres."),
    account_id: z.uuid().nullable(),
    rate_mode: z.enum(Constants.public.Enums.rate_mode),
    /** Em %; null quando o modo não usa taxa. */
    rate: z
      .number({ error: "Informe a taxa." })
      .min(0, "A taxa não pode ser negativa.")
      .max(1000, "Taxa alta demais; confira o valor.")
      .nullable(),
    rate_period: z.enum(Constants.public.Enums.rate_period),
    start_date: z.iso.date("Informe a data."),
    maturity_date: z.iso.date().nullable(),
    liquidity: z.enum(["diaria", "no_vencimento", "d_mais_n"]),
    liquidity_days: z.number().int().min(1).max(3650).nullable(),
    tax_exempt: z.boolean(),
    status: z.enum(["ativo", "resgatado"]),
    notes: z.string().trim().max(500, "Use até 500 caracteres."),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (RATE_MODES_WITH_RATE.includes(v.rate_mode) && v.rate === null)
      issue("rate", "Informe a taxa.");
    if (v.maturity_date && v.maturity_date < v.start_date)
      issue("maturity_date", "Vence antes da aplicação.");
    if (v.liquidity === "d_mais_n" && !v.liquidity_days)
      issue("liquidity_days", "Informe em quantos dias.");
  });

export type InvestmentInput = z.infer<typeof investmentSchema>;

export const movementSchema = z
  .object({
    kind: z.enum(Constants.public.Enums.investment_movement_kind),
    date: z.iso.date("Informe a data."),
    amount_cents: z
      .number({ error: "Informe o valor." })
      .int()
      .positive("Informe o valor."),
    /** Só aporte/resgate: lança a saída/entrada nesta conta. */
    account_id: z.uuid().nullable(),
    notes: z.string().trim().max(200, "Use até 200 caracteres."),
  })
  .refine((m) => !m.account_id || ["aporte", "resgate"].includes(m.kind), {
    path: ["account_id"],
    message: "Só aporte e resgate movimentam a conta.",
  });

export type MovementInput = z.infer<typeof movementSchema>;
