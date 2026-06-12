import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import { YEAR_CONFIG } from '../../config/constants.js';

export default function TimeSeriesSelector({
  startYear = YEAR_CONFIG.MIN,
  endYear = YEAR_CONFIG.MAX,
}) {
  const { year, setYear } = useMapStore(
    useShallow((state) => ({
      year: state.year,
      setYear: state.setYear,
    })),
  );
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleChange = (selectedYear) => {
    setYear(selectedYear);
  };

  const yearArray = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 bg-coffee-900/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2.5 py-1.5 hover:bg-coffee-900/90 transition-colors cursor-pointer"
        >
          <CalendarDays size={12} className="text-primary" />
          <span className="text-xs font-semibold text-primary">{year}</span>
          <ChevronRight size={14} className="text-white" />
        </button>
      )}

      {expanded && (
        <div className="bg-coffee-900/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 px-3 py-2 flex items-start lg:items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="shrink-0 text-right cursor-pointer hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <ChevronLeft size={12} className="text-white/30" />
              <p className="text-[9px] text-white/50 uppercase tracking-wider font-medium leading-none">
                Tahun
              </p>
            </div>
            <p className="text-sm font-semibold text-primary leading-tight mt-0.5">{year}</p>
          </button>

          <div className="w-px h-5 bg-white/10 shrink-0" />

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 pointer-events-none" />

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 max-w-[12rem] lg:max-w-none">
              {yearArray.map((yearDot) => {
                const isSelected = yearDot === year;
                const isPast = yearDot < year;
                return (
                  <div key={yearDot} className="relative flex items-center justify-center">
                    {hovered === yearDot && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-white text-[9px] font-medium rounded shadow-lg whitespace-nowrap z-10">
                        {yearDot}
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={`Pilih tahun ${yearDot}`}
                      onClick={() => handleChange(yearDot)}
                      onMouseEnter={() => setHovered(yearDot)}
                      onMouseLeave={() => setHovered(null)}
                      className={`z-10 rounded-full cursor-pointer border transition-all duration-200 ${
                        isSelected
                          ? 'w-2.5 h-2.5 bg-primary border-primary/70 shadow-md shadow-primary/40 scale-110'
                          : isPast
                            ? 'w-2 h-2 bg-primary/50 border-primary/40 hover:bg-primary/80'
                            : 'w-2 h-2 bg-white/20 border-white/10 hover:bg-white/40'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
