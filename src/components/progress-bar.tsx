import { cn } from "@/lib/utils";

/** Barra horizontal de 0–100% (valores fora da faixa são limitados). */
export function ProgressBar({
  pct,
  label,
  valueText,
  className,
}: {
  pct: number;
  label: string;
  valueText: string;
  /** Cor da parte preenchida (classe bg-*). */
  className: string;
}) {
  const value = Math.min(Math.max(pct, 0), 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className="h-2 overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn("h-full rounded-full", className)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
