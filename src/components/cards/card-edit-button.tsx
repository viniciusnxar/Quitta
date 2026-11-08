"use client";

import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Card } from "@/features/cards/queries";
import { CardForm } from "./card-form";

export function CardEditButton({
  card,
  accounts,
}: {
  card: Card;
  accounts: { id: string; name: string }[];
}) {
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
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Editar cartão"
      >
        {open && (
          <CardForm
            card={card}
            accounts={accounts}
            onDone={() => setOpen(false)}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}
