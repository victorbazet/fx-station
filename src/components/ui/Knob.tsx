import { useCallback, useRef } from "react";

interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  accent?: string;
  size?: number;
  disabled?: boolean;
}

const DRAG_SENSITIVITY = 200;
const MIN_ANGLE = -135;
const MAX_ANGLE = 135;

export function Knob({ value, onChange, label, accent = "#22d3ee", size = 72, disabled }: KnobProps) {
  const dragState = useRef<{ startY: number; startValue: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore: some synthetic/edge-case pointer sessions can't be captured.
      }
      dragState.current = { startY: e.clientY, startValue: value };
    },
    [disabled, value],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;
      const delta = (dragState.current.startY - e.clientY) / DRAG_SENSITIVITY;
      const next = Math.min(1, Math.max(0, dragState.current.startValue + delta));
      onChange(next);
    },
    [onChange],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore: nothing to release.
    }
    dragState.current = null;
  }, []);

  const angle = MIN_ANGLE + value * (MAX_ANGLE - MIN_ANGLE);

  return (
    <div className="flex select-none flex-col items-center gap-1.5">
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ width: size, height: size }}
        className={`relative touch-none rounded-full border border-neutral-700 bg-neutral-800 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] ${
          disabled ? "cursor-not-allowed opacity-40" : "cursor-ns-resize"
        }`}
      >
        <div className="absolute inset-[6%] rounded-full bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-950" />
        <div
          className="absolute left-1/2 top-1/2 w-[3px] origin-bottom rounded-full"
          style={{
            height: size * 0.4,
            backgroundColor: accent,
            boxShadow: `0 0 6px ${accent}`,
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
          }}
        />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
    </div>
  );
}
