"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/money/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMovement } from "@/features/investments/actions";
import type { Investment } from "@/features/investments/queries";
import {
  MOVEMENT_KIND_LABELS,
  type MovementKind,
} from "@/features/investments/schema";
import { today } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";

const NONE = "none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

export function MovementForm({
  investment,
  accounts,
  onDone,
}: {
  investment: Investment;
  accounts: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<MovementKind>("aporte");
  const [cents, setCents] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [accountId, setAccountId] = useState(investment.account_id ?? NONE);
  const [notes, setNotes] = useState("");
  const usesAccount = kind === "aporte" || kind === "resgate";
  const accountItems = {
    [NONE]: "Não movimentar conta",
    ...Object.fromEntries(accounts.map((a) => [a.id, a.name])),
  };
  const kindItems: Record<string, string> = MOVEMENT_KIND_LABELS;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!cents) return void toast.error("Informe o valor.");
        startTransition(async () => {
          const { error } = await addMovement(investment.id, {
            kind,
            date,
            amount_cents: cents,
            account_id: usesAccount && accountId !== NONE ? accountId : null,
            notes,
          });
          if (error) return void toast.error(error);
          toast.success("Movimento lançado.");
          onDone();
        });
      }}
      className="flex flex-col gap-4 pb-2"
    >
      <div className={labelClass}>
        Movimento
        <Select
          items={kindItems}
          value={kind}
          onValueChange={(v) => v && setKind(v as MovementKind)}
        >
          <SelectTrigger className="h-11 w-full" aria-label="Movimento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(kindItems).map(([v, text]) => (
              <SelectItem key={v} value={v}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          {kind === "atualizacao" ? "Saldo atual" : "Valor"}
          <MoneyInput autoFocus value={cents} onChange={setCents} />
        </label>
        <label className={labelClass}>
          Data
          <Input
            type="date"
            className="h-11 text-base"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      {kind === "atualizacao" && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Informe o saldo que aparece no banco ou corretora. Hoje o app mostra{" "}
          {formatBRL(investment.position)}.
        </p>
      )}

      {usesAccount && (
        <div className={labelClass}>
          {kind === "aporte" ? "Sai da conta" : "Entra na conta"}
          <Select
            items={accountItems}
            value={accountId}
            onValueChange={(v) => v && setAccountId(v)}
          >
            <SelectTrigger className="h-11 w-full" aria-label="Conta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(accountItems).map(([v, text]) => (
                <SelectItem key={v} value={v}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <label className={labelClass}>
        <span>
          Observações{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </span>
        <Input
          className="h-11 text-base"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Lançar"}
      </Button>
    </form>
  );
}
