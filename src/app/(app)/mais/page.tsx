import {
  CalendarDaysIcon,
  ChevronRightIcon,
  HomeIcon,
  LandmarkIcon,
  LayersIcon,
  PiggyBankIcon,
  RepeatIcon,
  Repeat2Icon,
  TagsIcon,
} from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/calendario", label: "Calendário", icon: CalendarDaysIcon },
  { href: "/contas", label: "Contas", icon: LandmarkIcon },
  { href: "/parcelamentos", label: "Parcelamentos", icon: LayersIcon },
  { href: "/assinaturas", label: "Assinaturas", icon: RepeatIcon },
  { href: "/recorrencias", label: "Salário e contas fixas", icon: Repeat2Icon },
  { href: "/financiamentos", label: "Financiamentos", icon: HomeIcon },
  { href: "/orcamento", label: "Orçamento", icon: PiggyBankIcon },
  { href: "/categorias", label: "Categorias e tags", icon: TagsIcon },
];

export default function MorePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Mais</h1>
      <ul className="divide-y rounded-lg border">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-14 items-center gap-3 px-3 hover:bg-accent"
            >
              <Icon className="size-5 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
