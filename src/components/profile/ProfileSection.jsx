import { COLORS } from '../../config/constants.js';

export function ProfileSection({ children }) {
  return <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-14">{children}</div>;
}

export function SectionHeader({ title, borderColor = COLORS.PRIMARY, dotColor = COLORS.PRIMARY }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b-2" style={{ borderColor }}>
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
    </div>
  );
}

export function SubSectionHeader({ title, dotColor = COLORS.PRIMARY }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">{title}</h3>
    </div>
  );
}
