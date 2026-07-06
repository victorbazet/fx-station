# FX Station

A Pioneer RMX-1000-inspired DJ effects station: browser-based, runs against a live audio
send/return loop from a DJ mixer through a USB audio interface. Built with React + Vite +
Tailwind and the native Web Audio API (no third-party DSP libraries).

## Requirements

- Chrome or Edge (this relies on `AudioWorklet`, `getUserMedia`, and — for output device
  selection — `HTMLMediaElement.setSinkId`, which is Chromium-only).
- A USB audio interface connected as a send/return loop on your mixer (or a direct loopback
  cable for latency testing).

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. In the browser's permission prompt, grant microphone/audio
input access — this is required even when your "microphone" is actually a USB interface,
since `getUserMedia` is the only browser API for capturing line-level audio input.

1. In **Input device** / **Output device**, pick your USB interface (not "System default"
   unless that's already your OS default device).
2. Click **Start**.
3. Check the **Latency** readout. `est. total` is the AudioContext-reported
   `baseLatency + outputLatency`. For a true end-to-end measurement (including the USB
   interface's own buffers and drivers), patch a cable from the interface's output back into
   its input and click **Measure loopback** — this plays a short click and times how long it
   takes to come back in via an `AudioWorkletNode`.

## Architecture

```
src/
  audio/            Audio engine — no React here
    AudioEngine.ts   Owns the AudioContext, device I/O, effect chain, release bus, latency
    effects/         One factory per effect (isolator, filterSweep, crush, delay, reverb)
    worklets/        AudioWorkletProcessor scripts (noise generator, click detector)
    devices.ts       enumerateDevices helpers
    impulseResponse.ts  Synthetic IR generator for the reverb's ConvolverNode
  hooks/             React <-> engine glue (useAudioEngine, useEffectControl)
  components/        UI (panels, knobs, pads, X-Y pad, latency meter, device settings)
```

Signal path: `input -> isolator -> filter sweep -> crush -> delay -> reverb -> output`, with a
parallel dry bus that the **Release** button crossfades to instantly, independent of each
effect's own on/off state.

## Deploying to Cloudflare Pages

```bash
npm run build
```

This outputs a static site to `dist/`. In the Cloudflare Pages dashboard (or via `wrangler
pages deploy dist`), set:

- Build command: `npm run build`
- Build output directory: `dist`

No server-side code or bindings are required — everything runs client-side in the browser.
