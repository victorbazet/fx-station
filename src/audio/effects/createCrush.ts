import { createWetDryBus } from "./wetDryWrapper";
import type { EffectUnit } from "../types";

const MAX_NOISE_GAIN = 0.22;

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 1024;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  const k = amount * 150;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Requires the "noise-processor" AudioWorklet module to already be registered
 * on `context` (see AudioEngine, which loads it once at startup).
 */
export function createCrush(context: BaseAudioContext): EffectUnit {
  const waveshaper = context.createWaveShaper();
  waveshaper.curve = makeDistortionCurve(0);
  waveshaper.oversample = "4x";

  const noiseSource = new AudioWorkletNode(context, "noise-processor", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0;
  noiseSource.connect(noiseGain);

  const chainInput = context.createGain();
  const chainOutput = context.createGain();

  chainInput.connect(waveshaper);
  waveshaper.connect(chainOutput);
  noiseGain.connect(chainOutput);

  const bus = createWetDryBus(context, chainInput, chainOutput);

  function setAmount(knobValue: number) {
    waveshaper.curve = makeDistortionCurve(knobValue);
    noiseGain.gain.setTargetAtTime(knobValue * MAX_NOISE_GAIN, context.currentTime, 0.02);
  }

  return {
    id: "crush",
    input: bus.input,
    output: bus.output,
    setActive: bus.setActive,
    setWetDry: bus.setWetDry,
    setParam: setAmount,
    dispose() {
      noiseSource.disconnect();
      noiseGain.disconnect();
      waveshaper.disconnect();
      chainInput.disconnect();
      chainOutput.disconnect();
    },
  };
}
