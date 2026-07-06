import { Knob } from "./ui/Knob";
import { Pad } from "./ui/Pad";

interface EffectPanelProps {
  title: string;
  accent: string;
  active: boolean;
  onToggleActive: () => void;
  paramLabel: string;
  paramValue: number;
  onParamChange: (value: number) => void;
  wetDry: number;
  onWetDryChange: (value: number) => void;
}

export function EffectPanel({
  title,
  accent,
  active,
  onToggleActive,
  paramLabel,
  paramValue,
  onParamChange,
  wetDry,
  onWetDryChange,
}: EffectPanelProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: accent }}>
        {title}
      </h3>
      <Pad active={active} onToggle={onToggleActive} label="on / off" accent={accent} />
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
        <Knob value={paramValue} onChange={onParamChange} label={paramLabel} accent={accent} size={64} />
        <Knob value={wetDry} onChange={onWetDryChange} label="wet/dry" accent={accent} size={64} />
      </div>
    </div>
  );
}
