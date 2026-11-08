"use client";

import { Loader2Icon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useState, useTransition } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransactionOptions } from "@/features/transactions/actions";
import { countFilters, filterParsers } from "@/features/transactions/filters";

const ALL = "all";

const TYPE_LABELS = {
  receita: "Receita",
  despesa: "Despesa",
  transferencia: "Transferência",
  pagamento_fatura: "Pagamento de fatura",
  aplicacao: "Aplicação",
  resgate: "Resgate",
};
const STATUS_LABELS = {
  pago: "Pago",
  previsto: "Previsto",
  cancelado: "Cancelado",
};

export function TransactionFilters({
  options,
}: {
  options: TransactionOptions;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // shallow: false → o servidor refaz a consulta a cada mudança.
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    startTransition,
  });
  const active = countFilters(filters);

  const categoryItems: Record<string, string> = {};
  for (const root of options.categories.filter((c) => !c.parent_id)) {
    categoryItems[root.id] =
      `${root.name} (${root.kind === "receita" ? "receita" : "despesa"})`;
    for (const sub of options.categories.filter((c) => c.parent_id === root.id))
      categoryItems[sub.id] = `${root.name} › ${sub.name}`;
  }

  return (
    <div className="flex gap-2">
      <label className="relative flex-1">
        <span className="sr-only">Buscar</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar descrição"
          className="h-11 pl-9 text-base"
          value={filters.q ?? ""}
          onChange={(e) =>
            setFilters(
              { q: e.target.value || null },
              { limitUrlUpdates: debounce(300) },
            )
          }
        />
        {pending && (
          <Loader2Icon
            aria-label="Carregando"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </label>

      <Button
        variant="outline"
        className="h-11 gap-2"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontalIcon />
        Filtros
        {active > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {active}
          </span>
        )}
      </Button>

      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Filtros">
        <div className="flex flex-col gap-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            {(["de", "ate"] as const).map((key) => (
              <label
                key={key}
                className="flex flex-col gap-1.5 text-sm font-medium"
              >
                {key === "de" ? "De" : "Até"}
                <Input
                  type="date"
                  className="h-11 text-base"
                  value={filters[key] ?? ""}
                  onChange={(e) =>
                    setFilters({ [key]: e.target.value || null })
                  }
                />
              </label>
            ))}
          </div>

          <FilterSelect
            label="Tipo"
            items={TYPE_LABELS}
            value={filters.tipo}
            onChange={(tipo) =>
              setFilters({ tipo: tipo as keyof typeof TYPE_LABELS | null })
            }
          />
          <FilterSelect
            label="Status"
            items={STATUS_LABELS}
            value={filters.status}
            onChange={(status) =>
              setFilters({
                status: status as keyof typeof STATUS_LABELS | null,
              })
            }
          />
          <FilterSelect
            label="Conta"
            items={Object.fromEntries(
              options.accounts.map((a) => [a.id, a.name]),
            )}
            value={filters.conta}
            onChange={(conta) => setFilters({ conta })}
          />
          {options.cards.length > 0 && (
            <FilterSelect
              label="Cartão"
              items={Object.fromEntries(
                options.cards.map((c) => [c.id, c.name]),
              )}
              value={filters.cartao}
              onChange={(cartao) => setFilters({ cartao })}
            />
          )}
          <FilterSelect
            label="Categoria"
            items={categoryItems}
            value={filters.categoria}
            onChange={(categoria) => setFilters({ categoria })}
          />
          {options.tags.length > 0 && (
            <FilterSelect
              label="Tag"
              items={Object.fromEntries(
                options.tags.map((t) => [t.id, t.name]),
              )}
              value={filters.tag}
              onChange={(tag) => setFilters({ tag })}
            />
          )}

          <Button className="h-11" onClick={() => setOpen(false)}>
            Ver resultados
          </Button>
          {active > 0 && (
            <Button
              variant="ghost"
              className="h-11"
              onClick={() =>
                setFilters({
                  de: null,
                  ate: null,
                  conta: null,
                  cartao: null,
                  categoria: null,
                  tag: null,
                  tipo: null,
                  status: null,
                })
              }
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </ResponsiveDialog>
    </div>
  );
}

function FilterSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Record<string, string>;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const all = { [ALL]: "Qualquer", ...items };
  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <Select
        items={all}
        value={value ?? ALL}
        onValueChange={(v) => onChange(!v || v === ALL ? null : v)}
      >
        <SelectTrigger className="h-11 w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(all).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
