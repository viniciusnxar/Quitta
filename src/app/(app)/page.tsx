import { Suspense } from "react";
import { MonthSwitcher } from "@/components/layout/month-switcher";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense>
        <MonthSwitcher />
      </Suspense>
      <h1 className="text-2xl font-semibold">Início</h1>
    </div>
  );
}
