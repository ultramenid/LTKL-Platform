import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMapStore } from "../store/mapStore.js";
import { loadGEEPolygonRaster } from "../store/mapLayerStore.js";
import { YEAR_CONFIG } from "../config/constants.js";

// Komponen timeline slider untuk memilih tahun coverage data
// Letak: bottom-left corner map
// Fungsi: reload GEE raster ketika user ubah tahun
export default function TimeSeriesSelector({ map, startYear = YEAR_CONFIG.MIN, endYear = YEAR_CONFIG.MAX }) {
  const { year, setYear, breadcrumbs } = useMapStore();
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Click year dot: update global year + reload GEE raster dengan tahun baru
  const handleChange = async (selectedYear) => {
    if (!map) {
      console.warn("⚠️ Tidak ada map instance");
      return;
    }
    setYear(selectedYear);

    const geeFilters = {};
    if (breadcrumbs.kab) geeFilters.kab = breadcrumbs.kab;
    if (breadcrumbs.kec) geeFilters.kec = breadcrumbs.kec;
    if (breadcrumbs.des) geeFilters.des = breadcrumbs.des;
    geeFilters.year = String(selectedYear);

    await loadGEEPolygonRaster(map, geeFilters);
  };

  const yearArray = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div className="absolute bottom-5 left-4 select-none">
      {/* ── Collapsed pill ── */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2.5 py-1.5 hover:bg-gray-900/90 transition-colors cursor-pointer"
        >
          <CalendarDays size={12} className="text-teal-400" />
          <span className="text-xs font-black text-teal-400">{year}</span>
          <ChevronRight size={14} className="text-white" />
        </button>
      )}

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="bg-gray-900/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 px-3 py-2 flex items-center gap-3">
          {/* Year label — klik untuk collapse */}
          <button
            onClick={() => setExpanded(false)}
            className="shrink-0 text-right cursor-pointer hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <ChevronLeft size={12} className="text-white/30" />
              <p className="text-[8px] text-white/40 uppercase tracking-widest font-semibold leading-none">Tahun</p>
            </div>
            <p className="text-sm font-black text-teal-400 leading-tight mt-0.5">{year}</p>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10" />

          {/* Timeline dots */}
          <div className="relative flex items-center gap-1.5">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 pointer-events-none" />
            {yearArray.map((yearDot) => {
              const isSelected = yearDot === year;
              const isPast = yearDot < year;
              return (
                <div key={yearDot} className="relative flex items-center justify-center">
                  {hovered === yearDot && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-teal-500 text-white text-[9px] font-bold rounded shadow-lg whitespace-nowrap">
                      {yearDot}
                    </div>
                  )}
                  <button
                    onClick={() => handleChange(yearDot)}
                    onMouseEnter={() => setHovered(yearDot)}
                    onMouseLeave={() => setHovered(null)}
                    className={`z-10 rounded-full cursor-pointer border transition-all duration-200 ${
                      isSelected
                        ? "w-2.5 h-2.5 bg-teal-400 border-teal-300 shadow-md shadow-teal-500/40 scale-110"
                        : isPast
                        ? "w-2 h-2 bg-teal-700 border-teal-600 hover:bg-teal-500"
                        : "w-2 h-2 bg-white/20 border-white/10 hover:bg-white/40"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

