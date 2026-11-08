import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-3xl font-semibold">Quitta</h1>
      <Suspense>{children}</Suspense>
    </main>
  );
}
