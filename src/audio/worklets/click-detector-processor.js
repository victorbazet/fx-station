/**
 * Listens on its input for the first sample crossing an amplitude threshold
 * and reports the AudioContext time of detection back to the main thread.
 * Used for the loopback round-trip latency measurement.
 */
class ClickDetectorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.armed = false;
    this.threshold = 0.15;
    this.port.onmessage = (event) => {
      if (event.data.type === "arm") {
        this.threshold = event.data.threshold ?? this.threshold;
        this.armed = true;
      } else if (event.data.type === "disarm") {
        this.armed = false;
      }
    };
  }

  process(inputs) {
    if (!this.armed) return true;

    const input = inputs[0];
    if (!input || input.length === 0) return true;

    for (const channelData of input) {
      for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) >= this.threshold) {
          this.armed = false;
          this.port.postMessage({ type: "detected", time: currentTime });
          return true;
        }
      }
    }

    return true;
  }
}

registerProcessor("click-detector-processor", ClickDetectorProcessor);
