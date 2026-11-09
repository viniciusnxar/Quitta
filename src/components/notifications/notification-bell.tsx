import { BellIcon } from "lucide-react";
import Link from "next/link";
import { countUnread } from "@/features/notifications/queries";

export function BellLink({ count }: { count: number }) {
  return (
    <Link
      href="/mensagens"
      aria-label={count ? `Mensagens: ${count} não lidas` : "Mensagens"}
      className="relative flex size-11 items-center justify-center rounded-md hover:bg-accent"
    >
      <BellIcon className="size-5" />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/** Sino do topo com o número de mensagens não lidas. Envolver em <Suspense>. */
export async function NotificationBell() {
  return <BellLink count={await countUnread()} />;
}
