import { useEffect, useState } from "react";
import type { AudioEngine } from "../audio/AudioEngine";
import type { EffectId } from "../audio/types";
import type { IsolatorEffect } from "../audio/effects/createIsolator";

interface StandardEffectState {
  active: boolean;
  param: number;
  wetDry: number;
}

export function useStandardEffectControl(engine: AudioEngine | null, id: EffectId, initial: { param: number; wetDry: number }) {
  const [state, setState] = useState<StandardEffectState>({ active: false, ...initial });

  useEffect(() => {
    if (!engine) return;
    const effect = engine.effects[id];
    effect.setActive(state.active);
    effect.setParam(state.param);
    effect.setWetDry(state.wetDry);
    // Intentionally only re-runs when the engine instance changes: pushes the
    // UI's current defaults into a freshly created engine, exactly once.
  }, [engine]);

  return {
    state,
    setActive(active: boolean) {
      setState((s) => ({ ...s, active }));
      engine?.effects[id].setActive(active);
    },
    setParam(param: number) {
      setState((s) => ({ ...s, param }));
      engine?.effects[id].setParam(param);
    },
    setWetDry(wetDry: number) {
      setState((s) => ({ ...s, wetDry }));
      engine?.effects[id].setWetDry(wetDry);
    },
  };
}

interface IsolatorState {
  active: boolean;
  low: number;
  mid: number;
  high: number;
  wetDry: number;
}

export function useIsolatorControl(engine: AudioEngine | null, initial: Omit<IsolatorState, "active">) {
  const [state, setState] = useState<IsolatorState>({ active: false, ...initial });

  useEffect(() => {
    if (!engine) return;
    const effect = engine.effects.isolator as IsolatorEffect;
    effect.setActive(state.active);
    effect.setBandGain("low", state.low);
    effect.setBandGain("mid", state.mid);
    effect.setBandGain("high", state.high);
    effect.setWetDry(state.wetDry);
  }, [engine]);

  function bandSetter(band: "low" | "mid" | "high") {
    return (value: number) => {
      setState((s) => ({ ...s, [band]: value }));
      (engine?.effects.isolator as IsolatorEffect | undefined)?.setBandGain(band, value);
    };
  }

  return {
    state,
    setActive(active: boolean) {
      setState((s) => ({ ...s, active }));
      engine?.effects.isolator.setActive(active);
    },
    setLow: bandSetter("low"),
    setMid: bandSetter("mid"),
    setHigh: bandSetter("high"),
    setWetDry(wetDry: number) {
      setState((s) => ({ ...s, wetDry }));
      engine?.effects.isolator.setWetDry(wetDry);
    },
  };
}
