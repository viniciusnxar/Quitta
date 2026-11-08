"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FabNew } from "./fab-new";
import { isActive, NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const [first, second, ...rest] = NAV_ITEMS;

  const item = ({ href, label, icon: Icon }: (typeof NAV_ITEMS)[number]) => (
    <Link
      key={href}
      href={href}
      aria-current={isActive(pathname, href) ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground",
        "aria-[current=page]:font-medium aria-[current=page]:text-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {item(first)}
      {item(second)}
      <div className="flex flex-1 justify-center">
        <FabNew
          trigger={
            <button
              type="button"
              aria-label="Novo lançamento"
              className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
            >
              <PlusIcon className="size-6" />
            </button>
          }
        />
      </div>
      {rest.map(item)}
    </nav>
  );
}
