import { createWetDryBus } from "./wetDryWrapper";
import type { EffectUnit } from "../types";

export type IsolatorBand = "low" | "mid" | "high";

export interface IsolatorEffect extends EffectUnit {
  setBandGain(band: IsolatorBand, knobValue: number): void;
}

const MIN_DB = -30;
const MAX_DB = 6;

/** Maps a 0..1 knob value to a gain in dB, centered at 0dB (unity) when knobValue = 0.5. */
function knobToDb(knobValue: number): number {
  if (knobValue >= 0.5) {
    return ((knobValue - 0.5) / 0.5) * MAX_DB;
  }
  return (1 - knobValue / 0.5) * MIN_DB;
}

export function createIsolator(context: BaseAudioContext): IsolatorEffect {
  const low = context.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 200;

  const mid = context.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 0.9;

  const high = context.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 4000;

  low.connect(mid);
  mid.connect(high);

  const bus = createWetDryBus(context, low, high);

  function setBandGain(band: IsolatorBand, knobValue: number) {
    const db = knobToDb(knobValue);
    const node = band === "low" ? low : band === "mid" ? mid : high;
    node.gain.setTargetAtTime(db, context.currentTime, 0.02);
  }

  return {
    id: "isolator",
    input: bus.input,
    output: bus.output,
    setActive: bus.setActive,
    setWetDry: bus.setWetDry,
    setParam: (value) => setBandGain("low", value),
    setSecondaryParam: (value) => setBandGain("mid", value),
    setBandGain,
    dispose() {
      low.disconnect();
      mid.disconnect();
      high.disconnect();
    },
  };
}
