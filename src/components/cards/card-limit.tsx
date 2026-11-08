import { ProgressBar } from "@/components/progress-bar";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

/** Barra de limite usado: verde até 70%, amarela até 90%, vermelha acima. */
export function CardLimit({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : used > 0 ? 100 : 0;
  const available = limit - used;

  return (
    <div className="flex flex-col gap-1.5">
      <ProgressBar
        pct={pct}
        label="Limite usado"
        valueText={`${pct}% do limite usado`}
        className={
          pct < 70 ? "bg-green-600" : pct < 90 ? "bg-amber-500" : "bg-red-600"
        }
      />
      <div className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>
          Usado {formatBRL(used)} ({pct}%)
        </span>
        <span className={cn(available < 0 && "text-red-600")}>
          Disponível {formatBRL(available)}
        </span>
      </div>
    </div>
  );
}
