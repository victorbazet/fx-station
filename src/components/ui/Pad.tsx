interface PadProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  accent?: string;
}

export function Pad({ active, onToggle, label, accent = "#22d3ee" }: PadProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="flex aspect-square w-20 flex-col items-center justify-center gap-2 rounded-lg border-2 border-neutral-700 bg-neutral-900 transition-transform active:scale-95 sm:w-24"
      style={
        active
          ? {
              borderColor: accent,
              boxShadow: `0 0 18px ${accent}66, inset 0 0 14px ${accent}33`,
            }
          : undefined
      }
    >
      <span
        className="h-3 w-3 rounded-full transition-colors"
        style={{
          backgroundColor: active ? accent : "#3f3f46",
          boxShadow: active ? `0 0 10px ${accent}` : "none",
        }}
      />
      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-200">{label}</span>
    </button>
  );
}
