import { Suspense } from "react";
import { NotificationsView } from "@/components/notifications/notifications-view";
import {
  getNotifyDaysBefore,
  listNotifications,
} from "@/features/notifications/queries";

export default function MessagesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<Skeleton />}>
        <Messages />
      </Suspense>
    </div>
  );
}

async function Messages() {
  const [notifications, daysBefore] = await Promise.all([
    listNotifications(),
    getNotifyDaysBefore(),
  ]);
  return (
    <NotificationsView notifications={notifications} daysBefore={daysBefore} />
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 w-56 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
