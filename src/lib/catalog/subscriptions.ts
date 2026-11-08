// Catálogo de provedores de assinatura (só no front). O slug vai para
// subscriptions.provider; nome e valor continuam editáveis pelo usuário.
// Sem logos de marca: cor + ícone genérico do tipo de serviço.

export type ProviderKind =
  | "musica"
  | "video"
  | "nuvem"
  | "ia"
  | "jogos"
  | "compras"
  | "educacao"
  | "saude"
  | "transporte"
  | "comida"
  | "trabalho";

export type Provider = {
  slug: string;
  name: string;
  kind: ProviderKind;
  /** Cor de fundo do avatar (aproximação da cor da marca). */
  color: string;
  /** Fundo claro: usar ícone escuro. */
  light?: boolean;
  /** Nome de categoria de despesa sugerida (criadas no cadastro do usuário). */
  category: string;
};

export const PROVIDERS: readonly Provider[] = [
  {
    slug: "spotify",
    name: "Spotify",
    kind: "musica",
    color: "#1DB954",
    category: "Assinaturas",
  },
  {
    slug: "apple_music",
    name: "Apple Music",
    kind: "musica",
    color: "#FA243C",
    category: "Assinaturas",
  },
  {
    slug: "deezer",
    name: "Deezer",
    kind: "musica",
    color: "#A238FF",
    category: "Assinaturas",
  },
  {
    slug: "youtube_premium",
    name: "YouTube Premium",
    kind: "video",
    color: "#FF0000",
    category: "Assinaturas",
  },
  {
    slug: "netflix",
    name: "Netflix",
    kind: "video",
    color: "#E50914",
    category: "Assinaturas",
  },
  {
    slug: "prime_video",
    name: "Amazon Prime",
    kind: "video",
    color: "#00A8E1",
    category: "Assinaturas",
  },
  {
    slug: "disney_plus",
    name: "Disney+",
    kind: "video",
    color: "#113CCF",
    category: "Assinaturas",
  },
  {
    slug: "max",
    name: "Max",
    kind: "video",
    color: "#002BE7",
    category: "Assinaturas",
  },
  {
    slug: "globoplay",
    name: "Globoplay",
    kind: "video",
    color: "#FB0F4B",
    category: "Assinaturas",
  },
  {
    slug: "paramount_plus",
    name: "Paramount+",
    kind: "video",
    color: "#0064FF",
    category: "Assinaturas",
  },
  {
    slug: "apple_tv",
    name: "Apple TV+",
    kind: "video",
    color: "#111111",
    category: "Assinaturas",
  },
  {
    slug: "crunchyroll",
    name: "Crunchyroll",
    kind: "video",
    color: "#F47521",
    category: "Assinaturas",
  },
  {
    slug: "google_one",
    name: "Google One",
    kind: "nuvem",
    color: "#4285F4",
    category: "Assinaturas",
  },
  {
    slug: "icloud",
    name: "iCloud+",
    kind: "nuvem",
    color: "#3693F3",
    category: "Assinaturas",
  },
  {
    slug: "dropbox",
    name: "Dropbox",
    kind: "nuvem",
    color: "#0061FF",
    category: "Assinaturas",
  },
  {
    slug: "microsoft_365",
    name: "Microsoft 365",
    kind: "trabalho",
    color: "#D83B01",
    category: "Assinaturas",
  },
  {
    slug: "canva",
    name: "Canva",
    kind: "trabalho",
    color: "#00C4CC",
    category: "Assinaturas",
  },
  {
    slug: "chatgpt",
    name: "ChatGPT Plus",
    kind: "ia",
    color: "#10A37F",
    category: "Assinaturas",
  },
  {
    slug: "claude",
    name: "Claude",
    kind: "ia",
    color: "#D97757",
    category: "Assinaturas",
  },
  {
    slug: "xbox_game_pass",
    name: "Xbox Game Pass",
    kind: "jogos",
    color: "#107C10",
    category: "Lazer",
  },
  {
    slug: "playstation_plus",
    name: "PlayStation Plus",
    kind: "jogos",
    color: "#0070D1",
    category: "Lazer",
  },
  {
    slug: "meli_plus",
    name: "Meli+",
    kind: "compras",
    color: "#FFE600",
    light: true,
    category: "Assinaturas",
  },
  {
    slug: "ifood_clube",
    name: "Clube iFood",
    kind: "comida",
    color: "#EA1D2C",
    category: "Alimentação",
  },
  {
    slug: "uber_one",
    name: "Uber One",
    kind: "transporte",
    color: "#000000",
    category: "Transporte",
  },
  {
    slug: "wellhub",
    name: "Wellhub (Gympass)",
    kind: "saude",
    color: "#E8106D",
    category: "Saúde",
  },
  {
    slug: "duolingo",
    name: "Duolingo",
    kind: "educacao",
    color: "#58CC02",
    category: "Educação",
  },
];

const bySlug = new Map(PROVIDERS.map((p) => [p.slug, p]));

export function getProvider(
  slug: string | null | undefined,
): Provider | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

// "Disney+" acha "disney"; "música" e "musica" são iguais.
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export function searchProviders(query: string): readonly Provider[] {
  const q = normalize(query);
  if (!q) return PROVIDERS;
  return PROVIDERS.filter(
    (p) => normalize(p.name).includes(q) || normalize(p.slug).includes(q),
  );
}
