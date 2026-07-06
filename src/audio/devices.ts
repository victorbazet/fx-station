import type { DeviceInfo } from "./types";

export async function listAudioDevices(): Promise<{
  inputs: DeviceInfo[];
  outputs: DeviceInfo[];
}> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs: DeviceInfo[] = [];
  const outputs: DeviceInfo[] = [];

  for (const d of devices) {
    if (d.kind === "audioinput") {
      inputs.push({ deviceId: d.deviceId, label: d.label || `Input ${inputs.length + 1}` });
    } else if (d.kind === "audiooutput") {
      outputs.push({ deviceId: d.deviceId, label: d.label || `Output ${outputs.length + 1}` });
    }
  }

  return { inputs, outputs };
}

export function supportsOutputDeviceSelection(): boolean {
  return typeof (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId === "function";
}
