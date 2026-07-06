import { createWetDryBus } from "./wetDryWrapper";
import type { EffectUnit } from "../types";

const MIN_DELAY = 0.03;
const MAX_DELAY = 1.2;
const FEEDBACK = 0.38;

export interface DelayEffect extends EffectUnit {
  setDelayTime(knobValue: number): void;
}

export function createDelay(context: BaseAudioContext): DelayEffect {
  const delayNode = context.createDelay(MAX_DELAY + 0.1);
  delayNode.delayTime.value = 0.25;

  const feedbackGain = context.createGain();
  feedbackGain.gain.value = FEEDBACK;

  // Gentle highpass/lowpass in the feedback loop so repeats darken over time,
  // like a real analog echo rather than an infinite pristine loop.
  const feedbackFilter = context.createBiquadFilter();
  feedbackFilter.type = "bandpass";
  feedbackFilter.frequency.value = 2200;
  feedbackFilter.Q.value = 0.5;

  const chainInput = context.createGain();
  const chainOutput = context.createGain();

  chainInput.connect(delayNode);
  delayNode.connect(chainOutput);
  delayNode.connect(feedbackFilter);
  feedbackFilter.connect(feedbackGain);
  feedbackGain.connect(delayNode);

  const bus = createWetDryBus(context, chainInput, chainOutput);

  function setDelayTime(knobValue: number) {
    const seconds = MIN_DELAY + knobValue * (MAX_DELAY - MIN_DELAY);
    delayNode.delayTime.setTargetAtTime(seconds, context.currentTime, 0.02);
  }

  return {
    id: "delay",
    input: bus.input,
    output: bus.output,
    setActive: bus.setActive,
    setWetDry: bus.setWetDry,
    setParam: setDelayTime,
    setDelayTime,
    dispose() {
      delayNode.disconnect();
      feedbackGain.disconnect();
      feedbackFilter.disconnect();
      chainInput.disconnect();
      chainOutput.disconnect();
    },
  };
}
