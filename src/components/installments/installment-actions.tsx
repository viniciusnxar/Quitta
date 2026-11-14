"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { deleteInstallmentPlan } from "@/features/installments/actions";
import type { InstallmentPlan } from "@/features/installments/queries";
import type { TransactionOptions } from "@/features/transactions/actions";
import { InstallmentForm } from "./installment-form";

export function InstallmentActions({
  plan,
  options,
}: {
  plan: InstallmentPlan;
  options: TransactionOptions;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const { error } = await deleteInstallmentPlan(plan.id);
      if (error) return void toast.error(error);
      toast.success("Parcelamento excluído.");
      router.replace("/parcelamentos");
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-11 gap-2"
          onClick={() => setOpen(true)}
        >
          <PencilIcon /> Editar
        </Button>
        <Button
          variant={confirming ? "destructive" : "outline"}
          className="h-11 gap-2"
          disabled={pending}
          onClick={() => (confirming ? remove() : setConfirming(true))}
        >
          <Trash2Icon /> {confirming ? "Confirmar exclusão" : "Excluir"}
        </Button>
      </div>
      {confirming && (
        <p className="text-xs text-muted-foreground">
          Excluir apaga todas as parcelas deste parcelamento, inclusive as já
          pagas.
        </p>
      )}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Editar parcelamento"
      >
        {open && (
          <InstallmentForm
            plan={plan}
            options={options}
            onDone={() => setOpen(false)}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}
