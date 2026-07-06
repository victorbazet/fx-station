import { createWetDryBus } from "./wetDryWrapper";
import { generateImpulseResponse } from "../impulseResponse";
import type { EffectUnit } from "../types";

const MIN_DURATION = 0.6;
const MAX_DURATION = 4.5;
const DECAY_CURVE = 2.2;
const REGEN_DEBOUNCE_MS = 60;

export interface ReverbEffect extends EffectUnit {
  setSize(knobValue: number): void;
}

export function createReverb(context: BaseAudioContext): ReverbEffect {
  const convolver = context.createConvolver();
  convolver.normalize = true;
  convolver.buffer = generateImpulseResponse(context, 1.8, DECAY_CURVE);

  const chainInput = context.createGain();
  const chainOutput = context.createGain();
  chainInput.connect(convolver);
  convolver.connect(chainOutput);

  const bus = createWetDryBus(context, chainInput, chainOutput);

  let regenTimer: ReturnType<typeof setTimeout> | null = null;

  function setSize(knobValue: number) {
    const duration = MIN_DURATION + knobValue * (MAX_DURATION - MIN_DURATION);
    if (regenTimer) clearTimeout(regenTimer);
    regenTimer = setTimeout(() => {
      convolver.buffer = generateImpulseResponse(context, duration, DECAY_CURVE);
    }, REGEN_DEBOUNCE_MS);
  }

  return {
    id: "reverb",
    input: bus.input,
    output: bus.output,
    setActive: bus.setActive,
    setWetDry: bus.setWetDry,
    setParam: setSize,
    setSize,
    dispose() {
      if (regenTimer) clearTimeout(regenTimer);
      convolver.disconnect();
      chainInput.disconnect();
      chainOutput.disconnect();
    },
  };
}
