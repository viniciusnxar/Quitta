"use client";

import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Account } from "@/features/accounts/queries";
import { AccountForm } from "./account-form";

export function AccountEditButton({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="h-11 gap-2"
        onClick={() => setOpen(true)}
      >
        <PencilIcon /> Editar
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Editar conta">
        {open && (
          <AccountForm account={account} onDone={() => setOpen(false)} />
        )}
      </ResponsiveDialog>
    </>
  );
}
