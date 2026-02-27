import { useState } from "react";
import { useMapStore } from "../store/mapStore.js";
import { loadGEEPolygonRaster } from "../store/mapLayerStore.js";
import { YEAR_CONFIG } from "../config/constants.js";

// Komponen timeline slider untuk memilih tahun coverage data
// Letak: bottom-left corner map
// Fungsi: reload GEE raster ketika user ubah tahun
export default function TimeSeriesSelector({ map, startYear = YEAR_CONFIG.MIN, endYear = YEAR_CONFIG.MAX }) {
  const { year, setYear, breadcrumbs } = useMapStore();
  const [hovered, setHovered] = useState(null); // Track dot yang di-hover untuk tooltip

  // Click year dot: update global year + reload GEE raster dengan tahun baru
  const handleChange = async (selectedYear) => {
    // Guard: pastikan map instance ada
    if (!map) {
      console.warn("⚠️ Tidak ada map instance");
      return;
    }

    // Update global year state (akan trigger URL sync otomatis)
    setYear(selectedYear);
    console.log("🕒 Tahun dipilih:", selectedYear);

    // Build filters berdasarkan drill level sekarang (kab/kec/des)
    // Pass filters ini ke GEE server: "mau raster tahun XXXX untuk area YYY"
    const geeFilters = {};
    if (breadcrumbs.kab) geeFilters.kab = breadcrumbs.kab;
    if (breadcrumbs.kec) geeFilters.kec = breadcrumbs.kec;
    if (breadcrumbs.des) geeFilters.des = breadcrumbs.des;
    geeFilters.year = String(selectedYear);

    // Reload GEE raster coverage dengan tahun & area yang baru
    console.log("♻️ Reload GEE raster dengan filters:", geeFilters);
    await loadGEEPolygonRaster(map, geeFilters);
  };

  // Generate array tahun dari min ke max (untuk render dots)
  const yearArray = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div className="absolute bottom-4 left-4 select-none bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200">
      {/* Current year display */}
      <div className="flex items-center justify-between text-[10px] text-gray-600">
        <span className="text-[#115e59] font-black">{year}</span>
      </div>

      {/* Timeline slider dengan dots */}
      <div className="relative flex items-center justify-center gap-[6px] h-6">
        {/* Background line (dasar timeline) */}
        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-gray-300 -translate-y-1/2 pointer-events-none"></div>

        {/* Year dots dengan tooltip hover */}
        {yearArray.map((yearDot) => (
          <div key={yearDot} className="relative flex items-center justify-center">
            {/* Tooltip yang muncul saat hover */}
            {hovered === yearDot && (
              <div className="absolute -top-5 px-1.5 py-[1px] bg-[#14b8a6] text-white text-[10px] rounded shadow-sm animate-fadeIn whitespace-nowrap">
                {yearDot}
              </div>
            )}
            {/* Dot button untuk select tahun */}
            <button
              onClick={() => handleChange(yearDot)}
              onMouseEnter={() => setHovered(yearDot)}
              onMouseLeave={() => setHovered(null)}
              className={`
                z-10 w-[9px] h-[9px] cursor-pointer rounded-full flex items-center justify-center border border-white transition-all duration-200
                ${yearDot === year
                  ? "bg-[#14b8a6] scale-110 shadow ring-1 ring-emerald-300"
                  : "bg-gray-300 hover:bg-gray-400 hover:scale-105"
                }
              `}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
