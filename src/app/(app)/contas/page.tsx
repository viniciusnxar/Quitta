import { Suspense } from "react";
import { AccountsView } from "@/components/accounts/accounts-view";
import { listAccounts } from "@/features/accounts/queries";

export default function AccountsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Suspense fallback={<AccountsSkeleton />}>
        <Accounts />
      </Suspense>
    </div>
  );
}

async function Accounts() {
  const accounts = await listAccounts();
  return <AccountsView accounts={accounts} />;
}

function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-11 w-40 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
