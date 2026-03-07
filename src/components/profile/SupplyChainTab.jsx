import { SankeySupplyChain } from './SankeySupplyChain.jsx';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

// ─── DATA KARTU STATISTIK RANTAI PASOK ───
const DATA_STATISTIK_RANTAI = [
  { label: 'Total Export Volume', value: '26.0 Jt', satuan: 'ton CPO (2022)' },
  { label: 'Largest Exporter',    value: 'Wilmar',  satuan: 'Nabati Indonesia' },
  { label: 'Top Destination',     value: 'India',   satuan: '35% of volume'   },
  { label: 'Origin Region',       value: 'Riau',    satuan: 'main origin hub'  },
];

// ─── DATA TUJUAN EKSPOR ───
const DATA_TUJUAN_EKSPOR = [
  { tujuan: 'India',         volume: '9,100k',  pct: 35.0, color: '#ef4444' },
  { tujuan: 'Tiongkok',      volume: '7,000k',  pct: 26.9, color: '#3b82f6' },
  { tujuan: 'Pakistan',      volume: '3,100k',  pct: 11.9, color: '#f59e0b' },
  { tujuan: 'Malaysia',      volume: '2,200k',  pct: 8.5,  color: '#22c55e' },
  { tujuan: 'Bangladesh',    volume: '1,800k',  pct: 6.9,  color: '#8b5cf6' },
  { tujuan: 'Netherlands',   volume: '1,400k',  pct: 5.4,  color: '#06b6d4' },
  { tujuan: 'Lainnya',       volume: '1,400k',  pct: 5.4,  color: '#9ca3af' },
];

// Tab Rantai Pasok Komoditas
export function SupplyChainTab() {
  return (
    <ProfileSection>
      <SectionHeader title="Supply Chain" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      {/* ─── Kartu ringkasan statistik ekspor ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DATA_STATISTIK_RANTAI.map((itemStat) => (
          <div key={itemStat.label} className="bg-teal-50 border border-teal-100 p-4 rounded-lg">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">{itemStat.label}</p>
            <p className="text-2xl font-black text-teal-700 mt-1">{itemStat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{itemStat.satuan}</p>
          </div>
        ))}
      </div>

      {/* ─── Visualisasi Sankey alur rantai pasok ─── */}
      <div>
        <SubSectionHeader title="Supply Chain Flow" dotColor={COLORS.PRIMARY} />
        <SankeySupplyChain />
      </div>

      {/* ─── Tujuan ekspor & distribusi volume ─── */}
      <div>
        <SubSectionHeader title="Export Destinations" dotColor={COLORS.PRIMARY} />
        <div className="space-y-2">
          {DATA_TUJUAN_EKSPOR.map((itemTujuan) => (
            <div key={itemTujuan.tujuan} className="flex items-center gap-3">
              <div className="w-24 text-right text-xs text-gray-700 font-medium shrink-0">
                {itemTujuan.tujuan}
              </div>
              <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                <div
                  className="h-5 rounded transition-all"
                  style={{ width: `${itemTujuan.pct}%`, backgroundColor: itemTujuan.color }}
                />
              </div>
              <div className="w-20 flex justify-between text-xs text-gray-500 shrink-0">
                <span>{itemTujuan.volume}</span>
                <span className="font-semibold text-gray-700">{itemTujuan.pct}%</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-gray-400 mt-3">* Volume in thousand metric tons CPO equivalent</p>
      </div>
    </ProfileSection>
  );
}
