import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Quitta</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <form action={logout}>
          <Button type="submit" variant="outline" className="h-11 px-4">
            Sair
          </Button>
        </form>
      </div>
    </main>
  );
}
