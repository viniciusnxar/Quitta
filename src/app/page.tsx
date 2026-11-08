import { logout } from "@/features/auth/actions";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Quitta</h1>
      <form action={logout}>
        <button
          type="submit"
          className="h-11 rounded-md border px-4 font-medium"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
