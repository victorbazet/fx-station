interface ReleaseButtonProps {
  released: boolean;
  onToggle: () => void;
}

export function ReleaseButton({ released, onToggle }: ReleaseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={released}
      className={`h-20 w-full max-w-[10rem] rounded-xl border-2 text-sm font-extrabold uppercase tracking-[0.2em] transition-all active:scale-95 ${
        released
          ? "border-red-500 bg-red-500/20 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.55)]"
          : "border-neutral-700 bg-neutral-900 text-neutral-400"
      }`}
    >
      Release
    </button>
  );
}
