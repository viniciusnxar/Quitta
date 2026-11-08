"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { searchProviders, type Provider } from "@/lib/catalog/subscriptions";
import { ProviderLogo } from "./provider-logo";

/** Grade com busca; `null` = assinatura fora do catálogo. */
export function ProviderPicker({
  onSelect,
}: {
  onSelect: (provider: Provider | null) => void;
}) {
  const [query, setQuery] = useState("");
  const results = searchProviders(query);

  return (
    <div className="flex flex-col gap-3">
      <label className="relative">
        <span className="sr-only">Buscar serviço</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          autoFocus
          placeholder="Buscar serviço (Netflix, Spotify...)"
          className="h-11 pl-9 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {results.map((p) => (
          <li key={p.slug}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center text-xs hover:bg-accent"
            >
              <ProviderLogo provider={p.slug} />
              <span className="line-clamp-2">{p.name}</span>
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-2 text-center text-xs hover:bg-accent"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <PlusIcon className="size-5" />
            </span>
            Outro serviço
          </button>
        </li>
      </ul>
    </div>
  );
}
