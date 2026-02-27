import { useMapStore } from "../store/mapStore.js";

const BreadcrumbsComponent = ({ onHome, handleBreadcrumbs }) => {
  const { breadcrumbs } = useMapStore();

  // Bangun array breadcrumb items secara dinamis
  const items = [
    breadcrumbs.kab && { level: "kabupaten", label: breadcrumbs.kab },
    breadcrumbs.kec && { level: "kecamatan", label: breadcrumbs.kec },
    breadcrumbs.des && { level: "desa",      label: breadcrumbs.des },
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="absolute top-2 left-2 z-10 bg-white backdrop-blur-md p-2 rounded shadow text-xs flex gap-1 items-center">
      <button
        onClick={onHome}
        className="text-[#0f766e] hover:underline cursor-pointer font-semibold"
      >
        Home
      </button>

      {items.map((item) => (
        <span key={item.level} className="flex items-center gap-1">
          <span className="text-[#0f766e]">/</span>
          <button
            onClick={() => handleBreadcrumbs(item.level)}
            className="text-[#0f766e] hover:underline cursor-pointer"
          >
            {item.label}
          </button>
        </span>
      ))}
    </div>
  );
};

export default BreadcrumbsComponent;
