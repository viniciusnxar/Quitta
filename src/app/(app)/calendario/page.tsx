import { Suspense } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import { getCalendar } from "@/features/calendar/queries";
import { currentMonth, isMonth } from "@/lib/finance/dates";

export default function CalendarPage(props: PageProps<"/calendario">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Calendário</h1>
      <Suspense>
        <MonthSwitcher />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <Calendar {...props} />
      </Suspense>
    </div>
  );
}

async function Calendar({ searchParams }: PageProps<"/calendario">) {
  const { mes } = await searchParams;
  const month = typeof mes === "string" && isMonth(mes) ? mes : currentMonth();
  const events = await getCalendar(month);
  // key: troca de mês recomeça o estado (dia aberto).
  return <CalendarView key={month} month={month} events={events} />;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 animate-pulse rounded-md bg-muted" />
      <div className="h-80 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
