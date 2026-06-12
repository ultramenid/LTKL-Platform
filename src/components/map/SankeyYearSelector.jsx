import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import { MAPBIOMAS_YEAR_RANGE } from '../../config/constants.js';

const MIN_YEAR = MAPBIOMAS_YEAR_RANGE.MIN;
const MAX_YEAR = MAPBIOMAS_YEAR_RANGE.MAX;
const YEAR_SPAN = MAX_YEAR - MIN_YEAR;
const YEARS = Array.from({ length: YEAR_SPAN + 1 }, (_, i) => MIN_YEAR + i);

const toPercent = (year) => ((year - MIN_YEAR) / YEAR_SPAN) * 100;

export default function SankeyYearSelector() {
  const { sankeyStartYear, sankeyEndYear, setSankeyYears } = useMapStore(
    useShallow((state) => ({
      sankeyStartYear: state.sankeyStartYear,
      sankeyEndYear: state.sankeyEndYear,
      setSankeyYears: state.setSankeyYears,
    })),
  );
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(null);
  const [draftEnd, setDraftEnd] = useState(null);
  const [activeThumb, setActiveThumb] = useState(null); // 'start' | 'end' | null
  const containerRef = useRef(null);
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  const startYear = draftStart !== null ? draftStart : sankeyStartYear;
  const endYear = draftEnd !== null ? draftEnd : sankeyEndYear;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const commitDraft = useCallback(() => {
    if (draftStart !== null) {
      setSankeyYears(draftStart, draftEnd);
      setDraftStart(null);
      setDraftEnd(null);
    }
    setActiveThumb(null);
  }, [draftStart, draftEnd, setSankeyYears]);

  const handleStartChange = useCallback(
    (e) => {
      const val = Number(e.target.value);
      const next = Math.min(val, endYear - 1);
      setSankeyYears(next, endYear);
      setDraftStart(null);
      setDraftEnd(null);
    },
    [endYear, setSankeyYears],
  );

  const handleEndChange = useCallback(
    (e) => {
      const val = Number(e.target.value);
      const next = Math.max(val, startYear + 1);
      setSankeyYears(startYear, next);
      setDraftStart(null);
      setDraftEnd(null);
    },
    [startYear, setSankeyYears],
  );

  // Touch/drag start — enter draft mode so the thumb follows finger
  const onThumbPointerDown = (thumb) => () => {
    setActiveThumb(thumb);
    setDraftStart(sankeyStartYear);
    setDraftEnd(sankeyEndYear);
  };

  const startPct = toPercent(startYear);
  const endPct = toPercent(endYear);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium tabular-nums transition-colors cursor-pointer ${
          open
            ? 'bg-primary/10 border-primary/30 text-primary/80'
            : 'bg-stone-100 border-stone-200 text-stone-500 hover:border-primary/30 hover:text-primary/80 hover:bg-primary/10'
        }`}
        aria-label="Pilih rentang tahun"
        aria-expanded={open}
      >
        {sankeyStartYear} → {sankeyEndYear}
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-[300px] bg-coffee-900/92 backdrop-blur-md rounded-xl shadow-xl border border-white/10 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            {/* Range label */}
            <span className="shrink-0 text-[11px] font-semibold text-white/90 tabular-nums select-none whitespace-nowrap">
              {startYear} <span className="font-normal text-white/40">–</span> {endYear}
            </span>

            {/* Dual-range slider using two native inputs */}
            <div className="relative flex-1 h-6">
              {/* Base track */}
              <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-white/15 rounded-full" />

              {/* Year tick dots */}
              {YEARS.map((year) => (
                <span
                  key={year}
                  className="absolute top-1/2 w-[2px] h-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 pointer-events-none"
                  style={{ left: `${toPercent(year)}%` }}
                />
              ))}

              {/* Selected range bar */}
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 bg-primary rounded-full pointer-events-none"
                style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
              />

              {/* Start handle — native range input, visually hidden */}
              <input
                ref={startInputRef}
                type="range"
                min={MIN_YEAR}
                max={endYear - 1}
                value={startYear}
                onChange={handleStartChange}
                onPointerDown={onThumbPointerDown('start')}
                onPointerUp={commitDraft}
                aria-label="Tahun awal"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ pointerEvents: 'none' }}
              />

              {/* End handle — native range input, visually hidden */}
              <input
                ref={endInputRef}
                type="range"
                min={startYear + 1}
                max={MAX_YEAR}
                value={endYear}
                onChange={handleEndChange}
                onPointerDown={onThumbPointerDown('end')}
                onPointerUp={commitDraft}
                aria-label="Tahun akhir"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ pointerEvents: 'none' }}
              />

              {/* Visual thumb for start */}
              <span
                className={`absolute top-1/2 w-[16px] h-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[2.5px] border-primary shadow-lg transition-transform pointer-events-none ${
                  activeThumb === 'start' ? 'scale-110' : ''
                }`}
                style={{ left: `${startPct}%`, zIndex: startPct > 90 ? 4 : 3 }}
              />

              {/* Visual thumb for end */}
              <span
                className={`absolute top-1/2 w-[16px] h-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[2.5px] border-primary shadow-lg transition-transform pointer-events-none ${
                  activeThumb === 'end' ? 'scale-110' : ''
                }`}
                style={{ left: `${endPct}%`, zIndex: endPct < 10 ? 4 : 3 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
