"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteSampleData } from "@/features/sample/actions";

/** Apagar os dados de exemplo: o primeiro toque pede confirmação. */
export function DeleteSampleButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-dashed p-4">
      <h2 className="font-medium">Dados de exemplo</h2>
      <p className="text-sm text-muted-foreground">
        Sua conta veio com contas, cartão, parcelamento, assinaturas,
        financiamento e investimento de exemplo para você explorar. Pode editar
        à vontade ou apagar tudo de uma vez.
      </p>
      {confirming && (
        <p className="text-sm text-destructive">
          Isso apaga todos os dados de exemplo, incluindo o que você lançou nas
          contas e no cartão de exemplo. Não dá para desfazer.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={confirming ? "destructive" : "outline"}
          className="h-11 gap-2"
          disabled={pending}
          onClick={() => {
            if (!confirming) return setConfirming(true);
            startTransition(async () => {
              const { error } = await deleteSampleData();
              setConfirming(false);
              if (error) toast.error(error);
              else toast.success("Dados de exemplo apagados.");
            });
          }}
        >
          <Trash2Icon />
          {pending
            ? "Apagando..."
            : confirming
              ? "Confirmar: apagar tudo"
              : "Apagar dados de exemplo"}
        </Button>
        {confirming && !pending && (
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => setConfirming(false)}
          >
            Cancelar
          </Button>
        )}
      </div>
    </section>
  );
}
