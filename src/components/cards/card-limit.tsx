import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

/** Barra de limite usado: verde até 70%, amarela até 90%, vermelha acima. */
export function CardLimit({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : used > 0 ? 100 : 0;
  const available = limit - used;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-label="Limite usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(Math.max(pct, 0), 100)}
        aria-valuetext={`${pct}% do limite usado`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-full",
            pct < 70
              ? "bg-green-600"
              : pct < 90
                ? "bg-amber-500"
                : "bg-red-600",
          )}
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
        />
      </div>
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
