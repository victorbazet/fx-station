import { createWetDryBus } from "./wetDryWrapper";
import type { EffectUnit } from "../types";

const MIN_FREQ = 80;
const MAX_FREQ = 9000;

/** Logarithmic mapping so the knob feels musical across the full audible sweep range. */
function knobToFrequency(knobValue: number): number {
  const logMin = Math.log(MIN_FREQ);
  const logMax = Math.log(MAX_FREQ);
  return Math.exp(logMin + knobValue * (logMax - logMin));
}

export interface FilterSweepEffect extends EffectUnit {
  setResonance(knobValue: number): void;
}

export function createFilterSweep(context: BaseAudioContext): FilterSweepEffect {
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = MAX_FREQ;
  filter.Q.value = 4;

  const chainInput = context.createGain();
  const chainOutput = context.createGain();
  chainInput.connect(filter);
  filter.connect(chainOutput);

  const bus = createWetDryBus(context, chainInput, chainOutput);

  function setCutoff(knobValue: number) {
    filter.frequency.setTargetAtTime(knobToFrequency(knobValue), context.currentTime, 0.01);
  }

  function setResonance(knobValue: number) {
    filter.Q.setTargetAtTime(1 + knobValue * 18, context.currentTime, 0.01);
  }

  return {
    id: "filterSweep",
    input: bus.input,
    output: bus.output,
    setActive: bus.setActive,
    setWetDry: bus.setWetDry,
    setParam: setCutoff,
    setSecondaryParam: setResonance,
    setResonance,
    dispose() {
      filter.disconnect();
      chainInput.disconnect();
      chainOutput.disconnect();
    },
  };
}
