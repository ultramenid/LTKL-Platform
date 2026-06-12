import { COLORS } from '../../config/constants.js';

export function SubSectionHeader({ title, dotColor = COLORS.PRIMARY }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">{title}</h3>
    </div>
  );
}
