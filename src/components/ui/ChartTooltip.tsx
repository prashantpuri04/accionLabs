import type { TooltipState } from "../../types/charts";

export const ChartTooltip = ({ tooltip }: { tooltip: TooltipState | null }) => {
  if (!tooltip) return null;

  return (
    <div role="status" style={{
        left:`${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: 'translate(-50%,-115%)',
    }}
    className="pointer-events-none absolute z-20 min-w-[140px] rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-lg"
    >
        <div className="mb-1 font-semibold text-slate-100">{tooltip.title}</div>
      {tooltip.lines.map((line, idx) => (
        <div key={idx} className="text-slate-300">
          {line}
        </div>
      ))}
    </div>

  );
}