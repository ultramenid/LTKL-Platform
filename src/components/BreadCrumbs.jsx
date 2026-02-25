import { useMapStore } from "../store/mapStore.js";

const BreadcrumbsComponent = ({onHome, handeBreadcrumbs}) => {
  const { breadcrumbs, updateBreadcrumb } = useMapStore();

  // Only show breadcrumbs if any value exists
  const hasBreadcrumb = breadcrumbs.kab || breadcrumbs.kec || breadcrumbs.des;
  if (!hasBreadcrumb) return null;

  return (
    <div className="absolute top-2 left-2 z-10 bg-white backdrop-blur-md p-2 rounded shadow text-xs flex gap-1 items-center">
      {/* Home Button */}
      <button
        onClick={onHome}
        className="text-[#0f766e] hover:underline cursor-pointer font-semibold"
      >
        Home
      </button>

      {/* Kabupaten */}
      {breadcrumbs.kab && (
        <>
          <span className="text-[#0f766e]">/</span>
          <button
            onClick={() => handeBreadcrumbs("kabupaten", breadcrumbs.kab)}
            className="text-[#0f766e] hover:underline cursor-pointer"
          >
            {` ${breadcrumbs.kab}`}
          </button>
        </>
      )}

      {/* Kecamatan */}
      {breadcrumbs.kec && (
        <>
          <span className="text-[#0f766e]">/</span>
          <button
            onClick={() => handeBreadcrumbs("kecamatan", breadcrumbs.kec)}
            className="text-[#0f766e] hover:underline cursor-pointer"
          >
            {` ${breadcrumbs.kec}`}
          </button>
        </>
      )}

      {/* Desa */}
      {breadcrumbs.des && (
        <>
          <span className="text-[#0f766e]">/</span>
          <button
            onClick={() => updateBreadcrumb("desa", breadcrumbs.des)}
            className="text-[#0f766e] hover:underline cursor-pointer"
          >
            {` ${breadcrumbs.des}`}
          </button>
        </>
      )}
    </div>
  );
};

export default BreadcrumbsComponent;
