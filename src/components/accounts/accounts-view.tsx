"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Account } from "@/features/accounts/queries";
import { ACCOUNT_TYPE_LABELS } from "@/features/accounts/schema";
import { formatBRL } from "@/lib/finance/money";
import { AccountForm } from "./account-form";
import { AccountIcon } from "./account-icon";

export function AccountsView({ accounts }: { accounts: Account[] }) {
  // undefined = fechado · null = nova conta · Account = editando
  const [editing, setEditing] = useState<Account | null | undefined>();
  const active = accounts.filter((a) => !a.archived_at);
  const archived = accounts.filter((a) => a.archived_at);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contas</h1>
        <Button className="h-11 gap-2" onClick={() => setEditing(null)}>
          <PlusIcon /> Nova conta
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma conta ainda. Cadastre onde seu dinheiro está: banco, carteira,
          VR...
        </p>
      ) : (
        <AccountList accounts={active} onSelect={setEditing} />
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
            Arquivadas ({archived.length})
          </summary>
          <AccountList accounts={archived} onSelect={setEditing} />
        </details>
      )}

      <ResponsiveDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        title={editing ? "Editar conta" : "Nova conta"}
      >
        {editing !== undefined && (
          <AccountForm
            key={editing?.id ?? "new"}
            account={editing}
            onDone={() => setEditing(undefined)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}

function AccountList({
  accounts,
  onSelect,
}: {
  accounts: Account[];
  onSelect: (account: Account) => void;
}) {
  return (
    <ul className="divide-y rounded-lg border">
      {accounts.map((account) => (
        <li key={account.id}>
          <button
            type="button"
            onClick={() => onSelect(account)}
            className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
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
            <span className="text-right text-sm tabular-nums">
              <span className="block text-xs text-muted-foreground">
                Saldo inicial
              </span>
              {formatBRL(account.initial_balance)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
