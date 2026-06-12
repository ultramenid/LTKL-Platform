import { COLORS } from '../../config/constants.js';

export function SectionHeader({ title, kicker, accent, borderColor = COLORS.PRIMARY, dotColor }) {
  const accentColor = accent ?? dotColor ?? borderColor;
  return (
    <header className="mb-6">
      {kicker && (
        <p
          className="text-[10px] font-bold uppercase tracking-[0.24em] mb-1.5"
          style={{ color: accentColor }}
        >
          {kicker}
        </p>
      )}
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-coffee-900">
        {title}
      </h2>
      <div className="mt-3 flex items-center">
        <span className="h-[3px] w-10 shrink-0" style={{ backgroundColor: accentColor }} />
        <span className="h-px flex-1 bg-coffee-900/15" />
      </div>
    </header>
  );
}
