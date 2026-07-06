/**
 * Generates a synthetic exponential-decay impulse response for ConvolverNode,
 * so no external IR file has to be loaded/hosted.
 */
export function generateImpulseResponse(
  context: BaseAudioContext,
  durationSeconds: number,
  decay: number,
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const impulse = context.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }

  return impulse;
}
