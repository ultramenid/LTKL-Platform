import { useMapStore } from "../store/mapStore.js";

// Breadcrumb navigation component - tampilkan user path dari Indonesia → Kabupaten → Kecamatan → Desa
// Letak: top-left corner map
// Fungsi: 
//   - Home button: reset map ke initial state
//   - Level buttons: click untuk zoom ke level itu atau reset level lebih dalam
const BreadcrumbsComponent = ({ onHome, handleBreadcrumbs }) => {
  const { breadcrumbs } = useMapStore();

  // Build breadcrumb items dari breadcrumbs state (hanya yang ada/true)
  // Format: [{ level: "kabupaten", label: "Bantul" }, { level: "kecamatan", label: "Imogiri" }, ...]
  const breadcrumbItems = [
    breadcrumbs.kab && { level: "kabupaten", label: breadcrumbs.kab },
    breadcrumbs.kec && { level: "kecamatan", label: breadcrumbs.kec },
    breadcrumbs.des && { level: "desa", label: breadcrumbs.des },
  ].filter(Boolean); // Remove null/false items

  // Jangan render jika tidak ada breadcrumb (masih di level Indonesia)
  if (breadcrumbItems.length === 0) return null;

  return (
    <div className="absolute top-2 left-2 z-10 bg-white backdrop-blur-md p-2 rounded shadow text-xs flex gap-1 items-center">
      {/* Home button: reset semua breadcrumbs */}
      <button
        onClick={onHome}
        className="text-[#0f766e] hover:underline cursor-pointer font-semibold"
      >
        Home
      </button>

      {/* Breadcrumb items dengan separator "/" */}
      {breadcrumbItems.map((item) => (
        <span key={item.level} className="flex items-center gap-1">
          <span className="text-[#0f766e]">/</span>
          {/* Click breadcrumb: zoom ke level itu atau reset level lebih dalam */}
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
