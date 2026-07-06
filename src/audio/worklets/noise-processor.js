/**
 * Generates white noise on its single output. Amount/mix is controlled
 * downstream by a GainNode connected to this node's output.
 */
class NoiseProcessor extends AudioWorkletProcessor {
  process(_inputs, outputs) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; channel++) {
      const data = output[channel];
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return true;
  }
}

registerProcessor("noise-processor", NoiseProcessor);
