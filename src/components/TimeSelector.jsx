import { useState } from "react";
import { useMapStore } from "../store/mapStore.js";
import { loadGEEPolygonRaster } from "../store/mapLayerStore.js";

export default function TimeSeriesSelector({ map, startYear = 1990, endYear = 2024 }) {
  const { year, setYear, breadcrumbs } = useMapStore();
  const [hovered, setHovered] = useState(null);

  const handleChange = async (newYear) => {
    // check map instance
    if (!map) {
      console.warn(" No map instance available");
      return;
    }

    // Update global year
    setYear(newYear);
    console.log("🕒 Selected year:", newYear);

    // Build filters based on current drill level
    const filters = {};
    if (breadcrumbs.kab) filters.kab = breadcrumbs.kab;
    if (breadcrumbs.kec) filters.kec = breadcrumbs.kec;
    if (breadcrumbs.des) filters.des = breadcrumbs.des;
    filters.year = String(newYear);

    // Reload GEE raster for this filter
    console.log("♻️ Reloading GEE raster with filters:", filters);
    await loadGEEPolygonRaster(map, filters);
  };

  // Generate year array
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div className="absolute bottom-4 left-4 select-none bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200">
      {/* Year labels */}
      <div className="flex items-center justify-between text-[10px] text-gray-600">
        <span className="text-[#115e59] font-black">{year}</span>
      </div>

      {/* Timeline */}
      <div className="relative flex items-center justify-center gap-[6px] h-6">
        {/* Base line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-gray-300 -translate-y-1/2 pointer-events-none"></div>

        {/* Dots with hover-only tooltip */}
        {years.map((y) => (
          <div key={y} className="relative flex items-center justify-center">
            {hovered === y && (
              <div className="absolute -top-5 px-1.5 py-[1px] bg-[#14b8a6] text-white text-[10px] rounded shadow-sm animate-fadeIn whitespace-nowrap">
                {y}
              </div>
            )}
            <button
              onClick={() => handleChange(y)}
              onMouseEnter={() => setHovered(y)}
              onMouseLeave={() => setHovered(null)}
              className={`
                z-10 w-[9px] h-[9px] cursor-pointer rounded-full flex items-center justify-center border border-white transition-all duration-200
                ${y === year
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
