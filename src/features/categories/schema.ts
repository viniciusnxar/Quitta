import { z } from "zod";
import { PALETTE } from "@/lib/palette";
import { Constants } from "@/lib/supabase/database.types";

type Kind = (typeof Constants.public.Enums.category_kind)[number];
type Nature = (typeof Constants.public.Enums.category_nature)[number];

export const NATURE_LABELS: Record<Nature, string> = {
  salario: "Salário",
  renda_extra: "Renda extra",
  beneficio: "Benefício",
  reembolso: "Reembolso",
  fixa: "Fixa",
  variavel: "Variável",
  imposto: "Imposto",
  taxa: "Taxa",
  juros: "Juros",
  ajuste: "Ajuste",
  outro: "Outro",
};

/** Naturezas que fazem sentido para cada tipo (o banco aceita qualquer uma). */
export const NATURES_BY_KIND: Record<Kind, Nature[]> = {
  receita: [
    "salario",
    "renda_extra",
    "beneficio",
    "reembolso",
    "ajuste",
    "outro",
  ],
  despesa: ["fixa", "variavel", "imposto", "taxa", "juros", "ajuste", "outro"],
};

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(60, "Use até 60 caracteres."),
  kind: z.enum(Constants.public.Enums.category_kind),
  parent_id: z.uuid().nullable(),
  nature: z.enum(Constants.public.Enums.category_nature),
  color: z.enum(PALETTE),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(40, "Use até 40 caracteres."),
  color: z.enum(PALETTE),
});

export type TagInput = z.infer<typeof tagSchema>;
