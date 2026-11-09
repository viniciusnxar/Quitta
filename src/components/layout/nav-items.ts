import {
  ArrowLeftRightIcon,
  CreditCardIcon,
  EllipsisIcon,
  HouseIcon,
  LandmarkIcon,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Início", icon: HouseIcon },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRightIcon },
  { href: "/cartoes", label: "Cartões", icon: CreditCardIcon },
  { href: "/mais", label: "Mais", icon: EllipsisIcon },
] as const;

/** Barra lateral (desktop): tem espaço para Contas. */
export const SIDEBAR_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  { href: "/contas", label: "Contas", icon: LandmarkIcon },
  ...NAV_ITEMS.slice(2),
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
