import { useState } from 'react';
import { Layers } from 'lucide-react';

// LULC MapBiomas Indonesia Collection 4 classification data
// Hierarchy: parent category → subcategory (English name + Indonesian name + hex color)
const LULC_LEGEND = [
  {
    id: 1,
    nameEn: 'Forest',
    nameId: 'Hutan',
    color: '#1f8d49',
    children: [
      { code: 3, nameEn: 'Forest Formation', nameId: 'Formasi Hutan', color: '#1f8d49' },
      { code: 5, nameEn: 'Mangrove', nameId: 'Mangrove', color: '#04381d' },
      { code: 76, nameEn: 'Peat Swamp Forest', nameId: 'Hutan Rawa Gambut', color: '#2f7360' },
    ],
  },
  {
    id: 2,
    nameEn: 'Non-Forest Natural Formation',
    nameId: 'Tumbuhan Non-Hutan',
    color: '#d6bc74',
    children: [
      {
        code: 13,
        nameEn: 'Non-Forest Natural Vegetation',
        nameId: 'Tumbuhan Non-Hutan Lainnya',
        color: '#d89f5c',
      },
    ],
  },
  {
    id: 3,
    nameEn: 'Agriculture',
    nameId: 'Pertanian',
    color: '#E974ED',
    children: [
      { code: 40, nameEn: 'Rice Paddy', nameId: 'Sawah', color: '#f272c2' },
      { code: 35, nameEn: 'Oil Palm', nameId: 'Sawit', color: '#9065d0' },
      { code: 9, nameEn: 'Pulpwood Plantation', nameId: 'Kebun Kayu', color: '#7a5900' },
      { code: 21, nameEn: 'Other Agriculture', nameId: 'Pertanian Lainnya', color: '#ffefc3' },
    ],
  },
  {
    id: 4,
    nameEn: 'Non-Vegetated Area',
    nameId: 'Non Vegetasi',
    color: '#d4271e',
    children: [
      { code: 30, nameEn: 'Mining Pit', nameId: 'Lubang Tambang', color: '#9c0027' },
      { code: 24, nameEn: 'Urban Area', nameId: 'Permukiman', color: '#d4271e' },
      {
        code: 25,
        nameEn: 'Other Non-Vegetation',
        nameId: 'Non-Vegetasi Lainnya',
        color: '#db4d4f',
      },
    ],
  },
  {
    id: 5,
    nameEn: 'Water Body',
    nameId: 'Tubuh Air',
    color: '#2532e4',
    children: [
      { code: 31, nameEn: 'Aquaculture', nameId: 'Tambak', color: '#091077' },
      { code: 33, nameEn: 'River, Lake, Ocean', nameId: 'Sungai, Danau, Laut', color: '#2532e4' },
    ],
  },
  {
    id: 6,
    nameEn: 'Not Observed',
    nameId: 'Citra Tertutup Awan',
    color: '#ffffff',
    children: [],
  },
];

// LULC raster legend placed at bottom-left for easy access while user explores the map
export default function MapLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative z-10">
      {/* ── Collapsed mode ── */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2.5 py-1.5 hover:bg-gray-900/90 transition-colors cursor-pointer"
        >
          <Layers size={12} className="text-teal-400" />
          <span className="text-xs font-black text-white/80">Legenda</span>
        </button>
      )}

      {/* Expanded panel — floats upward (bottom-full) and scrollable */}
      {expanded && (
        <div className="absolute bottom-full  left-0 bg-gray-900/85 backdrop-blur-md rounded-xl shadow-xl border border-white/10 w-52 h-[50vh] flex flex-col overflow-hidden">
          {/* Header — stays visible while list scrolls */}
          <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Layers size={11} className="text-teal-400" />
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                Legenda LULC
              </p>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-white/30 hover:text-white/70 transition-colors cursor-pointer text-xs leading-none"
            >
              ✕
            </button>
          </div>

          {/* Legend list — scrollable area */}
          <div className="legend-scroll flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {LULC_LEGEND.map((category) => (
              <div key={category.id}>
                {/* Parent category row */}
                <div className="flex items-center gap-2 py-0.5">
                  <div
                    className="shrink-0 w-3 h-3 rounded-sm border border-white/20"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white/90 leading-tight">
                      {category.nameId}
                    </p>
                    <p className="text-[8px] text-white/40 leading-tight">{category.nameEn}</p>
                  </div>
                </div>

                {/* Subcategory rows */}
                {category.children.map((child) => (
                  <div key={child.code} className="flex items-center gap-2 py-0.5 pl-4">
                    <div
                      className="shrink-0 w-2.5 h-2.5 rounded-sm border border-white/15"
                      style={{ backgroundColor: child.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[9px] font-medium text-white/65 leading-tight">
                        {child.nameId}
                      </p>
                      <p className="text-[7.5px] text-white/30 leading-tight">{child.nameEn}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
