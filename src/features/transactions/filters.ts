// Filtros da lista na URL. Os mesmos parsers servem ao cliente (useQueryStates)
// e ao servidor (loader), então o servidor nunca recebe valor fora do formato.
import {
  createLoader,
  createParser,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { Constants } from "@/lib/supabase/database.types";

const regexParser = (re: RegExp) =>
  createParser({
    parse: (v) => (re.test(v) ? v : null),
    serialize: (v: string) => v,
  });

const uuid = regexParser(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);
const isoDate = regexParser(/^\d{4}-\d{2}-\d{2}$/);

export const filterParsers = {
  q: parseAsString,
  de: isoDate,
  ate: isoDate,
  conta: uuid,
  cartao: uuid,
  categoria: uuid,
  tag: uuid,
  tipo: parseAsStringLiteral(Constants.public.Enums.transaction_type),
  status: parseAsStringLiteral(Constants.public.Enums.transaction_status),
};

export type TransactionFilters = inferParserType<typeof filterParsers>;

export const loadFilters = createLoader(filterParsers);

/** Quantos filtros estão ativos (a busca conta à parte). */
export function countFilters(filters: TransactionFilters): number {
  return Object.entries(filters).filter(([k, v]) => k !== "q" && v !== null)
    .length;
}
