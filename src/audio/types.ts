export type EffectId = "isolator" | "filterSweep" | "crush" | "delay" | "reverb";

export interface EffectUnit {
  id: EffectId;
  input: AudioNode;
  output: AudioNode;
  /** Turn the effect fully on/off. When off, output is pure dry regardless of wet/dry knob. */
  setActive(active: boolean): void;
  /** 0 = fully dry, 1 = fully wet. Only audible when active. */
  setWetDry(wet: number): void;
  /** Set the effect's primary macro parameter, normalized 0..1. */
  setParam(value: number): void;
  /** Secondary parameter, used by units that expose two knobs (e.g. isolator bands, X-Y pad). */
  setSecondaryParam?(value: number): void;
  dispose(): void;
}

export interface DeviceInfo {
  deviceId: string;
  label: string;
}

export interface LatencyStats {
  /** Reported by the AudioContext: input hardware -> context, in seconds. */
  baseLatency: number;
  /** Reported by the AudioContext: context -> output hardware, in seconds. */
  outputLatency: number;
  /** Estimated total processing latency (baseLatency + outputLatency), in seconds. */
  estimatedTotal: number;
  /** Measured via loopback click test, in seconds. Null until a measurement has been run. */
  measuredRoundTrip: number | null;
  sampleRate: number;
}

export type EngineStatus =
  | "idle"
  | "requesting-permission"
  | "running"
  | "no-input-device"
  | "permission-denied"
  | "error";
