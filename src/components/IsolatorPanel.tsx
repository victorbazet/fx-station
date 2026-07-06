import { Knob } from "./ui/Knob";
import { Pad } from "./ui/Pad";

interface IsolatorPanelProps {
  accent: string;
  active: boolean;
  onToggleActive: () => void;
  low: number;
  mid: number;
  high: number;
  onLowChange: (value: number) => void;
  onMidChange: (value: number) => void;
  onHighChange: (value: number) => void;
  wetDry: number;
  onWetDryChange: (value: number) => void;
}

export function IsolatorPanel({
  accent,
  active,
  onToggleActive,
  low,
  mid,
  high,
  onLowChange,
  onMidChange,
  onHighChange,
  wetDry,
  onWetDryChange,
}: IsolatorPanelProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: accent }}>
        Isolator
      </h3>
      <Pad active={active} onToggle={onToggleActive} label="on / off" accent={accent} />
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-3">
        <Knob value={low} onChange={onLowChange} label="low" accent={accent} size={56} />
        <Knob value={mid} onChange={onMidChange} label="mid" accent={accent} size={56} />
        <Knob value={high} onChange={onHighChange} label="high" accent={accent} size={56} />
        <Knob value={wetDry} onChange={onWetDryChange} label="wet/dry" accent={accent} size={56} />
      </div>
    </div>
  );
}
