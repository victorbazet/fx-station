import { useEffect, useState } from "react";
import type { AudioEngine } from "../audio/AudioEngine";
import type { LatencyStats } from "../audio/types";

interface LatencyMeterProps {
  engine: AudioEngine | null;
}

const POLL_INTERVAL_MS = 500;

function ms(seconds: number): string {
  return `${(seconds * 1000).toFixed(1)} ms`;
}

export function LatencyMeter({ engine }: LatencyMeterProps) {
  const [stats, setStats] = useState<LatencyStats | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!engine) return;
    setStats(engine.getLatencyStats());
    const id = setInterval(() => setStats(engine.getLatencyStats()), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [engine]);

  async function handleMeasure() {
    if (!engine) return;
    setMeasuring(true);
    setError(null);
    try {
      await engine.measureRoundTripLatency();
      setStats(engine.getLatencyStats());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Measurement failed");
    } finally {
      setMeasuring(false);
    }
  }

  const total = stats ? stats.estimatedTotal * 1000 : null;
  const totalColor =
    total === null ? "text-neutral-500" : total < 15 ? "text-emerald-400" : total < 30 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-neutral-800 bg-neutral-950/70 px-4 py-2.5 font-mono text-xs text-neutral-300">
      <span className="font-bold uppercase tracking-widest text-neutral-500">Latency</span>
      <span>base {stats ? ms(stats.baseLatency) : "--"}</span>
      <span>output {stats ? ms(stats.outputLatency) : "--"}</span>
      <span className={`font-bold ${totalColor}`}>est. total {stats ? ms(stats.estimatedTotal) : "--"}</span>
      <span className={stats?.measuredRoundTrip != null ? "text-cyan-400" : "text-neutral-600"}>
        loopback {stats?.measuredRoundTrip != null ? ms(stats.measuredRoundTrip) : "not measured"}
      </span>
      <span className="text-neutral-600">{stats ? `${stats.sampleRate} Hz` : ""}</span>
      <button
        type="button"
        onClick={handleMeasure}
        disabled={!engine || measuring}
        className="rounded bg-neutral-800 px-2.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-neutral-200 hover:bg-neutral-700 disabled:opacity-40"
      >
        {measuring ? "Measuring…" : "Measure loopback"}
      </button>
      {error && <span className="text-red-400">{error}</span>}
    </div>
  );
}
