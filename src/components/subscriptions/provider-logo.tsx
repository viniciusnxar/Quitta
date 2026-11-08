import {
  BookOpenIcon,
  BriefcaseIcon,
  CarIcon,
  CloudIcon,
  DumbbellIcon,
  Gamepad2Icon,
  MusicIcon,
  RepeatIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TvIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react";
import { getProvider, type ProviderKind } from "@/lib/catalog/subscriptions";
import { cn } from "@/lib/utils";

const ICONS: Record<ProviderKind, LucideIcon> = {
  musica: MusicIcon,
  video: TvIcon,
  nuvem: CloudIcon,
  ia: SparklesIcon,
  jogos: Gamepad2Icon,
  compras: ShoppingBagIcon,
  educacao: BookOpenIcon,
  saude: DumbbellIcon,
  transporte: CarIcon,
  comida: UtensilsIcon,
  trabalho: BriefcaseIcon,
};

/** Avatar do provedor; assinatura fora do catálogo usa a cor dada e um ícone genérico. */
export function ProviderLogo({
  provider,
  color,
  className,
}: {
  provider: string | null | undefined;
  color?: string | null;
  className?: string;
}) {
  const p = getProvider(provider);
  const Icon = p ? ICONS[p.kind] : RepeatIcon;
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        p?.light ? "text-neutral-900" : "text-white",
        className,
      )}
      style={{ backgroundColor: p?.color ?? color ?? "#737373" }}
    >
      <Icon className="size-5" />
    </span>
  );
}
