import { Home, ChevronRight } from "lucide-react";
import { useMapStore } from "../store/mapStore.js";

// Breadcrumb navigation component
// Letak: top-left corner map (overlay)
const BreadcrumbsComponent = ({ onHome, handleBreadcrumbs }) => {
  const { breadcrumbs } = useMapStore();

  const breadcrumbItems = [
    breadcrumbs.kab && { level: "kabupaten", label: breadcrumbs.kab },
    breadcrumbs.kec && { level: "kecamatan", label: breadcrumbs.kec },
    breadcrumbs.des && { level: "desa",      label: breadcrumbs.des },
  ].filter(Boolean);

  if (breadcrumbItems.length === 0) return null;

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-gray-900/75 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg border border-white/10">
      {/* Home button */}
      <button
        onClick={onHome}
        className=" cursor-pointer flex items-center justify-center w-5 h-5 rounded-md text-white/60 hover:text-teal-400 transition-colors"
        title="Reset ke Indonesia"
      >
        <Home size={12} />
      </button>

      {/* Breadcrumb items */}
      {breadcrumbItems.map((item, idx) => {
        const isActive = idx === breadcrumbItems.length - 1;
        return (
          <span key={item.level} className="flex items-center gap-1">
            <ChevronRight size={10} className="text-white/25 shrink-0" />
            <button
              onClick={() => handleBreadcrumbs(item.level)}
              className={`cursor-pointer text-[11px] font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? "text-teal-400"
                  : "text-white/80 hover:text-teal-400"
              }`}
            >
              {item.label}
            </button>
          </span>
        );
      })}
    </div>
  );
};

export default BreadcrumbsComponent;

