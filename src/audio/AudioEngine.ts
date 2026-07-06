import type { DeviceInfo, EffectId, EffectUnit, EngineStatus, LatencyStats } from "./types";
import { createIsolator } from "./effects/createIsolator";
import { createFilterSweep } from "./effects/createFilterSweep";
import { createCrush } from "./effects/createCrush";
import { createDelay } from "./effects/createDelay";
import { createReverb } from "./effects/createReverb";
import { listAudioDevices } from "./devices";
import noiseProcessorUrl from "./worklets/noise-processor.js?url";
import clickDetectorUrl from "./worklets/click-detector-processor.js?url";

const RELEASE_RAMP_TIME_CONSTANT = 0.005;
const CLICK_DETECT_TIMEOUT_MS = 3000;
const EFFECT_ORDER: EffectId[] = ["isolator", "filterSweep", "crush", "delay", "reverb"];

export class AudioEngine {
  readonly context: AudioContext;
  readonly effects: Record<EffectId, EffectUnit>;

  private mediaStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  private readonly inputGain: GainNode;
  private readonly dryGain: GainNode;
  private readonly wetSumGain: GainNode;
  private readonly masterGain: GainNode;
  private readonly testToneBus: GainNode;

  private readonly outputStreamDestination: MediaStreamAudioDestinationNode;
  private readonly outputAudioEl: HTMLAudioElement;
  private usingCustomOutput = false;

  private clickDetector: AudioWorkletNode | null = null;
  private released = false;
  private measuredRoundTrip: number | null = null;

  status: EngineStatus = "idle";
  onStatusChange: ((status: EngineStatus) => void) | null = null;

  /** Use `AudioEngine.create()` instead — the effect chain needs an awaited worklet load. */
  private constructor(context: AudioContext, effects: Record<EffectId, EffectUnit>) {
    this.context = context;
    this.effects = effects;

    this.inputGain = context.createGain();
    this.dryGain = context.createGain();
    this.wetSumGain = context.createGain();
    this.masterGain = context.createGain();
    this.testToneBus = context.createGain();

    // Fully dry until the UI explicitly un-releases.
    this.dryGain.gain.value = 1;
    this.wetSumGain.gain.value = 0;

    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.masterGain);
    this.testToneBus.connect(this.masterGain);

    this.inputGain.connect(effects[EFFECT_ORDER[0]].input);
    for (let i = 0; i < EFFECT_ORDER.length - 1; i++) {
      effects[EFFECT_ORDER[i]].output.connect(effects[EFFECT_ORDER[i + 1]].input);
    }
    effects[EFFECT_ORDER[EFFECT_ORDER.length - 1]].output.connect(this.wetSumGain);
    this.wetSumGain.connect(this.masterGain);

    this.outputStreamDestination = context.createMediaStreamDestination();
    this.outputAudioEl = new Audio();
    this.outputAudioEl.autoplay = true;

    this.masterGain.connect(context.destination);
  }

  static async create(): Promise<AudioEngine> {
    const context = new AudioContext({ latencyHint: "interactive" });

    await Promise.all([
      context.audioWorklet.addModule(noiseProcessorUrl),
      context.audioWorklet.addModule(clickDetectorUrl),
    ]);

    const effects: Record<EffectId, EffectUnit> = {
      isolator: createIsolator(context),
      filterSweep: createFilterSweep(context),
      crush: createCrush(context),
      delay: createDelay(context),
      reverb: createReverb(context),
    };

    return new AudioEngine(context, effects);
  }

  private setStatus(status: EngineStatus) {
    this.status = status;
    this.onStatusChange?.(status);
  }

  async listDevices(): Promise<{ inputs: DeviceInfo[]; outputs: DeviceInfo[] }> {
    return listAudioDevices();
  }

  async start(inputDeviceId?: string): Promise<void> {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.setStatus("requesting-permission");

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: inputDeviceId ? { exact: inputDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.attachStream(stream);
      this.setStatus("running");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") {
        this.setStatus("no-input-device");
      } else if (err instanceof DOMException && err.name === "NotAllowedError") {
        this.setStatus("permission-denied");
      } else {
        this.setStatus("error");
      }
      throw err;
    }
  }

  private attachStream(stream: MediaStream) {
    this.micSource?.disconnect();
    this.mediaStream?.getTracks().forEach((t) => t.stop());

    this.mediaStream = stream;
    this.micSource = this.context.createMediaStreamSource(stream);
    this.micSource.connect(this.inputGain);
  }

  async setInputDevice(deviceId: string): Promise<void> {
    await this.start(deviceId);
  }

  async setOutputDevice(deviceId: string | null): Promise<void> {
    const el = this.outputAudioEl as HTMLAudioElement & {
      setSinkId?: (id: string) => Promise<void>;
    };

    if (!deviceId) {
      if (this.usingCustomOutput) {
        this.masterGain.disconnect(this.outputStreamDestination);
        this.outputAudioEl.pause();
        this.outputAudioEl.srcObject = null;
        this.usingCustomOutput = false;
        this.masterGain.connect(this.context.destination);
      }
      return;
    }

    if (!el.setSinkId) {
      throw new Error("This browser does not support selecting an output device.");
    }

    if (!this.usingCustomOutput) {
      this.masterGain.disconnect(this.context.destination);
      this.masterGain.connect(this.outputStreamDestination);
      this.outputAudioEl.srcObject = this.outputStreamDestination.stream;
      this.usingCustomOutput = true;
    }

    await el.setSinkId(deviceId);
    await this.outputAudioEl.play();
  }

  setReleased(released: boolean) {
    this.released = released;
    const now = this.context.currentTime;
    const dry = released ? 1 : 0;
    const wet = released ? 0 : 1;
    this.dryGain.gain.setTargetAtTime(dry, now, RELEASE_RAMP_TIME_CONSTANT);
    this.wetSumGain.gain.setTargetAtTime(wet, now, RELEASE_RAMP_TIME_CONSTANT);
  }

  isReleased(): boolean {
    return this.released;
  }

  getLatencyStats(): LatencyStats {
    const baseLatency = this.context.baseLatency ?? 0;
    const outputLatency = this.context.outputLatency ?? 0;
    return {
      baseLatency,
      outputLatency,
      estimatedTotal: baseLatency + outputLatency,
      measuredRoundTrip: this.measuredRoundTrip,
      sampleRate: this.context.sampleRate,
    };
  }

  /**
   * Plays a short click on the output and listens for it on the input.
   * Requires a physical loopback cable (output -> input) on the audio interface.
   */
  async measureRoundTripLatency(): Promise<number> {
    if (!this.clickDetector) {
      this.clickDetector = new AudioWorkletNode(this.context, "click-detector-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
      });
      this.inputGain.connect(this.clickDetector);
    }

    const detector = this.clickDetector;

    return new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => {
        detector.port.postMessage({ type: "disarm" });
        detector.port.onmessage = null;
        reject(new Error("No signal detected. Check the loopback cable (output -> input)."));
      }, CLICK_DETECT_TIMEOUT_MS);

      detector.port.onmessage = (event) => {
        if (event.data.type !== "detected") return;
        clearTimeout(timeout);
        detector.port.onmessage = null;
        const roundTrip = event.data.time - scheduledStartTime;
        this.measuredRoundTrip = roundTrip;
        resolve(roundTrip);
      };

      detector.port.postMessage({ type: "arm", threshold: 0.1 });

      const scheduledStartTime = this.context.currentTime + 0.05;
      const burst = this.context.createOscillator();
      burst.type = "square";
      burst.frequency.value = 880;
      const burstGain = this.context.createGain();
      burstGain.gain.setValueAtTime(0.9, scheduledStartTime);
      burstGain.gain.setValueAtTime(0, scheduledStartTime + 0.01);
      burst.connect(burstGain);
      burstGain.connect(this.testToneBus);
      burst.start(scheduledStartTime);
      burst.stop(scheduledStartTime + 0.02);
      burst.onended = () => {
        burst.disconnect();
        burstGain.disconnect();
      };
    });
  }

  dispose() {
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    Object.values(this.effects).forEach((e) => e.dispose());
    this.clickDetector?.disconnect();
    this.context.close();
  }
}
