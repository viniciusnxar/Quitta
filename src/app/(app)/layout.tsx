import { Suspense } from "react";
import { BottomNav, BottomNavView } from "@/components/layout/bottom-nav";
import { Sidebar, SidebarView } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

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
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" className="h-11 px-3">
                Sair
              </Button>
            </form>
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
    </div>
  );
}
