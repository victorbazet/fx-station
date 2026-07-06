import { useEffect, useRef, useState } from "react";
import type { AudioEngine } from "../audio/AudioEngine";

interface InputLevelMeterProps {
  engine: AudioEngine | null;
  active: boolean;
}

const SEGMENT_COUNT = 12;
const POLL_MS = 60;

export function InputLevelMeter({ engine, active }: InputLevelMeterProps) {
  const [peak, setPeak] = useState(0);
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!engine || !active) {
      setPeak(0);
      return;
    }
    rafRef.current = setInterval(() => setPeak(engine.getInputLevel()), POLL_MS);
    return () => {
      if (rafRef.current) clearInterval(rafRef.current);
    };
  }, [engine, active]);

  const litSegments = Math.round(peak * SEGMENT_COUNT);
  const silent = active && peak < 0.005;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/70 px-4 py-2.5">
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-500">Input</span>
      <div className="flex gap-[3px]">
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
          const lit = i < litSegments;
          const color = i >= SEGMENT_COUNT - 2 ? "#f87171" : i >= SEGMENT_COUNT - 5 ? "#facc15" : "#4ade80";
          return (
            <div
              key={i}
              className="h-4 w-2 rounded-sm"
              style={{
                backgroundColor: lit ? color : "#27272a",
                boxShadow: lit ? `0 0 6px ${color}` : "none",
              }}
            />
          );
        })}
      </div>
      {silent && <span className="font-mono text-xs text-amber-400">no signal — check input device/cable</span>}
    </div>
  );
}
