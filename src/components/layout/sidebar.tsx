"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FabNew } from "./fab-new";
import { isActive, SIDEBAR_ITEMS } from "./nav-items";

export function Sidebar() {
  return <SidebarView pathname={usePathname()} />;
}

/** Sem hook: serve de fallback do <Suspense> (pathname "" = nenhum item ativo). */
export function SidebarView({ pathname }: { pathname: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-4 border-r p-4 md:flex">
      <span className="px-2 text-xl font-semibold">Quitta</span>
      <FabNew
        trigger={
          <Button className="h-11 justify-start gap-2">
            <PlusIcon /> Novo
          </Button>
        }
      />
      <nav className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            className="flex h-11 items-center gap-3 rounded-md px-2 text-muted-foreground hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-foreground"
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
