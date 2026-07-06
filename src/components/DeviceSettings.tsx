import { useEffect, useState } from "react";
import type { AudioEngine } from "../audio/AudioEngine";
import type { DeviceInfo, EngineStatus } from "../audio/types";
import { supportsOutputDeviceSelection } from "../audio/devices";

interface DeviceSettingsProps {
  engine: AudioEngine | null;
  status: EngineStatus;
}

const STATUS_MESSAGES: Record<EngineStatus, string | null> = {
  idle: "Select an input device and press Start to begin monitoring.",
  "requesting-permission": "Requesting microphone/audio input permission…",
  running: null,
  "no-input-device": "No audio input device was found. Plug in your USB audio interface and click Refresh devices.",
  "permission-denied": "Microphone/audio input permission was denied. Allow access in the browser to continue.",
  error: "Could not start the audio input. Check your device and try again.",
};

export function DeviceSettings({ engine, status }: DeviceSettingsProps) {
  const [inputs, setInputs] = useState<DeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<DeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>("");
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [starting, setStarting] = useState(false);
  const outputSelectable = supportsOutputDeviceSelection();

  async function refreshDevices() {
    if (!engine) return;
    const { inputs: newInputs, outputs: newOutputs } = await engine.listDevices();
    setInputs(newInputs);
    setOutputs(newOutputs);
  }

  useEffect(() => {
    refreshDevices();
  }, [engine, status]);

  async function handleStart() {
    if (!engine) return;
    setStarting(true);
    try {
      await engine.start(selectedInput || undefined);
      await refreshDevices();
    } catch {
      // status already reflects the failure via engine.onStatusChange
    } finally {
      setStarting(false);
    }
  }

  async function handleOutputChange(deviceId: string) {
    setSelectedOutput(deviceId);
    if (!engine) return;
    try {
      await engine.setOutputDevice(deviceId || null);
    } catch (e) {
      console.error(e);
    }
  }

  const message = STATUS_MESSAGES[status];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-950/70 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Input device
          <select
            value={selectedInput}
            onChange={(e) => setSelectedInput(e.target.value)}
            className="min-w-[14rem] rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200"
          >
            <option value="">System default</option>
            {inputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Output device
          <select
            value={selectedOutput}
            onChange={(e) => handleOutputChange(e.target.value)}
            disabled={!outputSelectable}
            className="min-w-[14rem] rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200 disabled:opacity-40"
          >
            <option value="">System default</option>
            {outputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={refreshDevices}
          className="rounded bg-neutral-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-200 hover:bg-neutral-700"
        >
          Refresh devices
        </button>

        <button
          type="button"
          onClick={handleStart}
          disabled={!engine || starting || status === "running"}
          className="ml-auto rounded bg-cyan-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white hover:bg-cyan-500 disabled:opacity-40"
        >
          {status === "running" ? "Running" : starting ? "Starting…" : "Start"}
        </button>
      </div>

      {!outputSelectable && (
        <p className="text-xs text-amber-400">
          This browser does not support selecting a specific output device; audio will play on the system default
          output.
        </p>
      )}

      {message && (
        <p className={`text-sm ${status === "error" || status === "permission-denied" || status === "no-input-device" ? "text-red-400" : "text-neutral-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
