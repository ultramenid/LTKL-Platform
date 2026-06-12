import { useState } from 'react';
import { Layers } from 'lucide-react';

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

export default function MapLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative z-10">
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 bg-coffee-900/85 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2 py-1 hover:bg-coffee-900/95 transition-colors cursor-pointer"
        >
          <Layers size={10} className="text-primary" />
          <span className="text-[11px] font-semibold text-white/80">Legenda</span>
        </button>
      )}

      {expanded && (
        <div className="absolute bottom-full  left-0 bg-coffee-900/85 backdrop-blur-md rounded-xl shadow-xl border border-white/10 w-52 h-[50vh] flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Layers size={11} className="text-primary" />
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                Legenda LULC
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-white/50 hover:text-white/70 transition-colors cursor-pointer text-xs leading-none"
            >
              ✕
            </button>
          </div>

          <div className="legend-scroll flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {LULC_LEGEND.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-2 py-0.5">
                  <div
                    className="shrink-0 w-3 h-3 rounded-sm border border-white/20"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-white/95 leading-tight">
                      {category.nameId}
                    </p>
                    <p className="text-[8px] italic text-white/40 leading-tight mt-0.5">{category.nameEn}</p>
                  </div>
                </div>

                {category.children.map((child) => (
                  <div key={child.code} className="flex items-center gap-2 py-0.5 pl-4">
                    <div
                      className="shrink-0 w-2.5 h-2.5 rounded-sm border border-white/15"
                      style={{ backgroundColor: child.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-white/90 leading-tight">
                        {child.nameId}
                      </p>
                      <p className="text-[8px] italic text-white/35 leading-tight mt-0.5">{child.nameEn}</p>
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
