import { useCallback, useRef, useState } from "react";

interface XYPadProps {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  xLabel: string;
  yLabel: string;
  accent?: string;
}

export function XYPad({ x, y, onChange, xLabel, yLabel, accent = "#f472b6" }: XYPadProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = areaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
      onChange(nx, ny);
    },
    [onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore: some synthetic/edge-case pointer sessions can't be captured.
      }
      setDragging(true);
      updateFromPointer(e);
    },
    [updateFromPointer],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore: nothing to release.
    }
    setDragging(false);
  }, []);

  return (
    <div className="flex w-full max-w-sm select-none flex-col items-center gap-2">
      <div
        ref={areaRef}
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => dragging && updateFromPointer(e)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative aspect-square w-full touch-none overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "10% 10%",
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-800" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-neutral-800" />
        <div
          className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${x * 100}%`,
            top: `${(1 - y) * 100}%`,
            backgroundColor: accent,
            boxShadow: dragging ? `0 0 24px ${accent}` : `0 0 12px ${accent}88`,
          }}
        />
      </div>
      <div className="flex w-full justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        <span>{xLabel} &rarr;</span>
        <span>{yLabel} &uarr;</span>
      </div>
    </div>
  );
}
