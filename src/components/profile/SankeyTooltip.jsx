import { COLORS } from '../../config/constants.js';

export function SankeyTooltip({ tooltip }) {
  if (!tooltip.visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none min-w-40 max-w-[280px] whitespace-pre-wrap rounded-lg border bg-[rgba(15,23,42,0.95)] px-3 py-2 text-xs leading-relaxed text-slate-100 shadow-xl"
      style={{
        left: tooltip.x + 14,
        top: tooltip.y - 10,
        borderColor: COLORS.PRIMARY,
      }}
    >
      {tooltip.content.split('\n').map((lineText, lineIndex) => (
        <span
          key={lineIndex}
          style={{
            display: 'block',
            fontWeight: lineIndex === 0 ? 700 : 400,
            color: lineIndex === 0 ? COLORS.PRIMARY : '#cbd5e1',
          }}
        >
          {lineText}
        </span>
      ))}
    </div>
  );
}
