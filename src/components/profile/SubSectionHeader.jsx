import { COLORS } from '../../config/constants.js';

export function SubSectionHeader({ title, accent, dotColor = COLORS.PRIMARY }) {
  const accentColor = accent ?? dotColor;
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="h-[2px] w-5 shrink-0" style={{ backgroundColor: accentColor }} />
      <h3 className="text-[11px] font-bold text-coffee-700 uppercase tracking-[0.18em]">{title}</h3>
      <span className="h-px flex-1 bg-coffee-900/10" />
    </div>
  );
}
