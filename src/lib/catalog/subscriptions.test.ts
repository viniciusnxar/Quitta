import { describe, expect, it } from "vitest";
import { getProvider, PROVIDERS, searchProviders } from "./subscriptions";

// Categorias de despesa criadas por seed_default_categories (migration init).
const SEEDED = [
  "Assinaturas",
  "Lazer",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
];

describe("catálogo de assinaturas", () => {
  it("slugs únicos e categorias sugeridas existem no seed", () => {
    expect(new Set(PROVIDERS.map((p) => p.slug)).size).toBe(PROVIDERS.length);
    for (const p of PROVIDERS) expect(SEEDED).toContain(p.category);
  });

  it("busca ignora acento, caixa e símbolos", () => {
    expect(searchProviders("DISNEY")[0]?.slug).toBe("disney_plus");
    expect(searchProviders("gympass").map((p) => p.slug)).toEqual(["wellhub"]);
    expect(searchProviders("  ")).toHaveLength(PROVIDERS.length);
    expect(searchProviders("zzz")).toEqual([]);
  });

  it("getProvider tolera slug desconhecido ou vazio", () => {
    expect(getProvider("netflix")?.name).toBe("Netflix");
    expect(getProvider("nao_existe")).toBeUndefined();
    expect(getProvider(null)).toBeUndefined();
  });
});
