"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Account } from "@/features/accounts/queries";
import { ACCOUNT_TYPE_LABELS } from "@/features/accounts/schema";
import { formatBRL } from "@/lib/finance/money";
import { AccountForm } from "./account-form";
import { AccountIcon } from "./account-icon";

type AccountWithBalance = Account & { balance: number };

export function AccountsView({ accounts }: { accounts: AccountWithBalance[] }) {
  const [creating, setCreating] = useState(false);
  const active = accounts.filter((a) => !a.archived_at);
  const archived = accounts.filter((a) => a.archived_at);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contas</h1>
        <Button className="h-11 gap-2" onClick={() => setCreating(true)}>
          <PlusIcon /> Nova conta
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma conta ainda. Cadastre onde seu dinheiro está: banco, carteira,
          VR...
        </p>
      ) : (
        <AccountList accounts={active} />
      )}

      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Arquivadas ({archived.length})
          </summary>
          <AccountList accounts={archived} />
        </details>
      )}

      <ResponsiveDialog
        open={creating}
        onOpenChange={setCreating}
        title="Nova conta"
      >
        {creating && (
          <AccountForm account={null} onDone={() => setCreating(false)} />
        )}
      </ResponsiveDialog>
    </>
  );
}

function AccountList({ accounts }: { accounts: AccountWithBalance[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {accounts.map((account) => (
        <li key={account.id}>
          <Link
            href={`/contas/${account.id}`}
            className="flex min-h-16 items-center gap-3 px-3 py-2 hover:bg-accent"
          >
            <AccountIcon icon={account.icon} color={account.color} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{account.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[account.institution, ACCOUNT_TYPE_LABELS[account.type]]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span
              className={
                account.balance < 0
                  ? "font-medium text-red-600 tabular-nums"
                  : "font-medium tabular-nums"
              }
            >
              {formatBRL(account.balance)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
