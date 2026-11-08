import { PALETTE, type PaletteColor } from "@/lib/palette";

export function ColorPicker({
  value,
  onChange,
}: {
  value: PaletteColor;
  onChange: (color: PaletteColor) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Cor</legend>
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Cor ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className="size-11 rounded-full ring-offset-2 ring-offset-background aria-pressed:ring-2 aria-pressed:ring-foreground"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </fieldset>
  );
}
