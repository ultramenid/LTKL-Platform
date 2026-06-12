import { COLORS } from '../../config/constants.js';

export function SectionHeader({ title, borderColor = COLORS.PRIMARY, dotColor = COLORS.PRIMARY }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b-2" style={{ borderColor }}>
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
    </div>
  );
}
