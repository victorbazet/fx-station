const RAMP_TIME_CONSTANT = 0.01;

/**
 * Wraps a wet processing chain with a dry bypass path and a shared output bus,
 * so every effect gets consistent on/off + wet/dry behavior without clicks.
 *
 * input -> dryGain -----------------> output
 *       -> wetChainInput -> ... -> wetChainOutput -> wetGain -> output
 */
export function createWetDryBus(
  context: BaseAudioContext,
  wetChainInput: AudioNode,
  wetChainOutput: AudioNode,
) {
  const input = context.createGain();
  const dryGain = context.createGain();
  const wetGain = context.createGain();
  const output = context.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(wetChainInput);
  wetChainOutput.connect(wetGain);
  wetGain.connect(output);

  // Start fully bypassed (inactive).
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  let active = false;
  let wetAmount = 0.5;

  function apply() {
    const now = context.currentTime;
    const targetWet = active ? wetAmount : 0;
    const targetDry = active ? 1 - wetAmount : 1;
    wetGain.gain.setTargetAtTime(targetWet, now, RAMP_TIME_CONSTANT);
    dryGain.gain.setTargetAtTime(targetDry, now, RAMP_TIME_CONSTANT);
  }

  return {
    input,
    output,
    setActive(next: boolean) {
      active = next;
      apply();
    },
    setWetDry(wet: number) {
      wetAmount = Math.min(1, Math.max(0, wet));
      apply();
    },
    isActive() {
      return active;
    },
  };
}
