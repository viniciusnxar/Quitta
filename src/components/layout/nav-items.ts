import {
  ArrowLeftRightIcon,
  CreditCardIcon,
  EllipsisIcon,
  HouseIcon,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Início", icon: HouseIcon },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRightIcon },
  { href: "/cartoes", label: "Cartões", icon: CreditCardIcon },
  { href: "/mais", label: "Mais", icon: EllipsisIcon },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
