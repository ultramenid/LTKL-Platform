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
  // Local draft during drag — committing to the store on every pointermove
  // would fire an SWR refetch per pixel; commit once on release instead
  const [draft, setDraft] = useState(null);
  const [dragging, setDragging] = useState(null); // 'start' | 'end' | null
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const startYear = draft ? draft.start : sankeyStartYear;
  const endYear = draft ? draft.end : sankeyEndYear;

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

  const yearFromClientX = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(MIN_YEAR + ratio * YEAR_SPAN);
  }, []);

  const beginDrag = (handle) => (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(handle);
    setDraft({ start: sankeyStartYear, end: sankeyEndYear });
  };

  const moveDrag = (e) => {
    if (!dragging) return;
    const year = yearFromClientX(e.clientX);
    setDraft((current) => {
      if (!current) return current;
      if (dragging === 'start') {
        return { start: Math.min(year, current.end - 1), end: current.end };
      }
      return { start: current.start, end: Math.max(year, current.start + 1) };
    });
  };

  const endDrag = () => {
    if (!dragging) return;
    if (draft) setSankeyYears(draft.start, draft.end);
    setDragging(null);
    setDraft(null);
  };

  // Click on the track moves the nearest handle to that year
  const handleTrackClick = (e) => {
    if (dragging) return;
    const year = yearFromClientX(e.clientX);
    const distToStart = Math.abs(year - sankeyStartYear);
    const distToEnd = Math.abs(year - sankeyEndYear);
    if (distToStart <= distToEnd) {
      if (year < sankeyEndYear) setSankeyYears(year, sankeyEndYear);
    } else {
      if (year > sankeyStartYear) setSankeyYears(sankeyStartYear, year);
    }
  };

  const handleKeyDown = (handle) => (e) => {
    const delta = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!delta) return;
    e.preventDefault();
    if (handle === 'start') {
      const next = Math.min(Math.max(sankeyStartYear + delta, MIN_YEAR), sankeyEndYear - 1);
      setSankeyYears(next, sankeyEndYear);
    } else {
      const next = Math.max(Math.min(sankeyEndYear + delta, MAX_YEAR), sankeyStartYear + 1);
      setSankeyYears(sankeyStartYear, next);
    }
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
            ? 'bg-teal-50 border-teal-300 text-teal-700'
            : 'bg-stone-100 border-stone-200 text-stone-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50'
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
        <div className="absolute right-0 top-full mt-1.5 z-50 w-[300px] bg-gray-900/92 backdrop-blur-md rounded-xl shadow-xl border border-white/10 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            {/* Range label */}
            <span className="shrink-0 text-[11px] font-semibold text-white/90 tabular-nums select-none whitespace-nowrap">
              {startYear} <span className="font-normal text-white/40">–</span> {endYear}
            </span>

            {/* Slider */}
            <div
              ref={trackRef}
              className="relative flex-1 h-6 cursor-pointer touch-none"
              onClick={handleTrackClick}
            >
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
                className="absolute top-1/2 h-1.5 -translate-y-1/2 bg-teal-400 rounded-full pointer-events-none"
                style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
              />

              {/* Start handle */}
              <button
                type="button"
                role="slider"
                aria-label="Tahun awal"
                aria-valuemin={MIN_YEAR}
                aria-valuemax={endYear - 1}
                aria-valuenow={startYear}
                onPointerDown={beginDrag('start')}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={handleKeyDown('start')}
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-1/2 w-[16px] h-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[2.5px] border-teal-400 shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 transition-transform ${
                  dragging === 'start' ? 'scale-110' : 'hover:scale-110'
                }`}
                style={{ left: `${startPct}%`, zIndex: startPct > 90 ? 4 : 3 }}
              />

              {/* End handle */}
              <button
                type="button"
                role="slider"
                aria-label="Tahun akhir"
                aria-valuemin={startYear + 1}
                aria-valuemax={MAX_YEAR}
                aria-valuenow={endYear}
                onPointerDown={beginDrag('end')}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={handleKeyDown('end')}
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-1/2 w-[16px] h-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[2.5px] border-white/80 shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-transform ${
                  dragging === 'end' ? 'scale-110' : 'hover:scale-110'
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
