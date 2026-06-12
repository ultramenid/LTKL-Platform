import { COLORS } from '../../config/constants.js';

export function SankeyTooltip({ tooltip }) {
  if (!tooltip.visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none min-w-40 max-w-[280px] whitespace-pre-wrap border bg-coffee-900/95 px-3 py-2 text-xs leading-relaxed shadow-xl"
      style={{
        left: tooltip.x + 14,
        top: tooltip.y - 10,
        borderColor: COLORS.PRIMARY,
      }}
    >
      {tooltip.content.split('\n').map((lineText, lineIndex) => (
        <span
          key={lineIndex}
          className={
            lineIndex === 0
              ? 'block font-bold text-parchment-50'
              : 'block tabular-nums text-parchment-200/70'
          }
        >
          {lineText}
        </span>
      ))}
    </div>
  );
}
