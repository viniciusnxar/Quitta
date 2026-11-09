import { Suspense } from "react";
import { BottomNav, BottomNavView } from "@/components/layout/bottom-nav";
import { Sidebar, SidebarView } from "@/components/layout/sidebar";
import {
  BellLink,
  NotificationBell,
} from "@/components/notifications/notification-bell";
import { ProfileMenuLoader } from "@/components/profile/profile-menu-loader";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <Suspense fallback={<SidebarView pathname="" />}>
        <Sidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b bg-background px-4 pt-[env(safe-area-inset-top)]">
          <span className="text-lg font-semibold md:invisible">Quitta</span>
          <div className="flex items-center gap-1">
            <Suspense fallback={<BellLink count={0} />}>
              <NotificationBell />
            </Suspense>
            <ThemeToggle />
            <Suspense
              fallback={
                <div className="size-11 p-1.5" aria-hidden>
                  <div className="size-8 animate-pulse rounded-full bg-muted" />
                </div>
              }
            >
              <ProfileMenuLoader />
            </Suspense>
          </div>
        </header>
        {/* Espaço para a bottom nav (h-14) + safe area no mobile */}
        <main className="flex-1 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
          {children}
        </main>
      </div>
      <Suspense fallback={<BottomNavView pathname="" />}>
        <BottomNav />
      </Suspense>
      <Suspense fallback={null}>
        <GenerateRecurring />
      </Suspense>
    </div>
  );
}

/**
 * Gera assinaturas/recorrências dos próximos 90 dias e efetiva as automáticas que venceram.
 * Idempotente; roda quando o layout renderiza (carga inicial), sem bloquear a página.
 * shortcut: a página pode ler os dados antes da geração no 1º acesso do dia; mover para cron se incomodar.
 */
async function GenerateRecurring() {
  const supabase = await createClient();
  await supabase.rpc("generate_recurring");
  return null;
}
