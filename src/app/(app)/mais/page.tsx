import { ChevronRightIcon, LandmarkIcon } from "lucide-react";
import Link from "next/link";

const LINKS = [{ href: "/contas", label: "Contas", icon: LandmarkIcon }];

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
