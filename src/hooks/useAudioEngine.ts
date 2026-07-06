import { useEffect, useRef, useState } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import type { EngineStatus } from "../audio/types";

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [status, setStatus] = useState<EngineStatus>("idle");

  useEffect(() => {
    let cancelled = false;

    AudioEngine.create().then((created) => {
      if (cancelled) {
        created.dispose();
        return;
      }
      created.onStatusChange = setStatus;
      engineRef.current = created;
      setEngine(created);
    });

    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return { engine, status };
}
