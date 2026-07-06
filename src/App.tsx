import { useAudioEngine } from "./hooks/useAudioEngine";
import { useIsolatorControl, useStandardEffectControl } from "./hooks/useEffectControl";
import { DeviceSettings } from "./components/DeviceSettings";
import { LatencyMeter } from "./components/LatencyMeter";
import { InputLevelMeter } from "./components/InputLevelMeter";
import { ReleaseButton } from "./components/ReleaseButton";
import { EffectPanel } from "./components/EffectPanel";
import { IsolatorPanel } from "./components/IsolatorPanel";
import { XYPad } from "./components/ui/XYPad";
import { useState } from "react";

const ACCENT = {
  isolator: "#a78bfa",
  filterSweep: "#22d3ee",
  crush: "#fb923c",
  delay: "#34d399",
  reverb: "#38bdf8",
};

function App() {
  const { engine, status } = useAudioEngine();
  const [released, setReleased] = useState(false);

  const isolator = useIsolatorControl(engine, { low: 0.5, mid: 0.5, high: 0.5, wetDry: 0.5 });
  const filterSweep = useStandardEffectControl(engine, "filterSweep", { param: 1, wetDry: 0.5 });
  const crush = useStandardEffectControl(engine, "crush", { param: 0.3, wetDry: 0.5 });
  const delay = useStandardEffectControl(engine, "delay", { param: 0.3, wetDry: 0.4 });
  const reverb = useStandardEffectControl(engine, "reverb", { param: 0.4, wetDry: 0.35 });

  function toggleRelease() {
    const next = !released;
    setReleased(next);
    engine?.setReleased(next);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-5 p-4 text-neutral-100 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold uppercase tracking-[0.25em] text-neutral-100">FX Station</h1>
          <p className="text-xs text-neutral-500">DJ effects rig — send/return through your USB audio interface</p>
        </div>
        <ReleaseButton released={released} onToggle={toggleRelease} />
      </header>

      <DeviceSettings engine={engine} status={status} />
      <div className="flex flex-wrap gap-3">
        <LatencyMeter engine={engine} />
        <InputLevelMeter engine={engine} active={status === "running"} />
      </div>

      <main className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <IsolatorPanel
          accent={ACCENT.isolator}
          active={isolator.state.active}
          onToggleActive={() => isolator.setActive(!isolator.state.active)}
          low={isolator.state.low}
          mid={isolator.state.mid}
          high={isolator.state.high}
          onLowChange={isolator.setLow}
          onMidChange={isolator.setMid}
          onHighChange={isolator.setHigh}
          wetDry={isolator.state.wetDry}
          onWetDryChange={isolator.setWetDry}
        />

        <EffectPanel
          title="Filter Sweep"
          accent={ACCENT.filterSweep}
          active={filterSweep.state.active}
          onToggleActive={() => filterSweep.setActive(!filterSweep.state.active)}
          paramLabel="cutoff"
          paramValue={filterSweep.state.param}
          onParamChange={filterSweep.setParam}
          wetDry={filterSweep.state.wetDry}
          onWetDryChange={filterSweep.setWetDry}
        />

        <EffectPanel
          title="Noise / Crush"
          accent={ACCENT.crush}
          active={crush.state.active}
          onToggleActive={() => crush.setActive(!crush.state.active)}
          paramLabel="amount"
          paramValue={crush.state.param}
          onParamChange={crush.setParam}
          wetDry={crush.state.wetDry}
          onWetDryChange={crush.setWetDry}
        />

        <EffectPanel
          title="Echo / Delay"
          accent={ACCENT.delay}
          active={delay.state.active}
          onToggleActive={() => delay.setActive(!delay.state.active)}
          paramLabel="time"
          paramValue={delay.state.param}
          onParamChange={delay.setParam}
          wetDry={delay.state.wetDry}
          onWetDryChange={delay.setWetDry}
        />

        <EffectPanel
          title="Reverb"
          accent={ACCENT.reverb}
          active={reverb.state.active}
          onToggleActive={() => reverb.setActive(!reverb.state.active)}
          paramLabel="size"
          paramValue={reverb.state.param}
          onParamChange={reverb.setParam}
          wetDry={reverb.state.wetDry}
          onWetDryChange={reverb.setWetDry}
        />
      </main>

      <section className="flex flex-col items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">X-Y Pad</h2>
        <XYPad
          x={filterSweep.state.param}
          y={delay.state.param}
          onChange={(x, y) => {
            filterSweep.setParam(x);
            delay.setParam(y);
          }}
          xLabel="filter cutoff"
          yLabel="delay time"
          accent="#f472b6"
        />
      </section>
    </div>
  );
}

export default App;
