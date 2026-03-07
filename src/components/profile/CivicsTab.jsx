import ReactECharts from 'echarts-for-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

// ─── DATA PEJABAT PEMERINTAH ───
const DATA_PEJABAT_PEMERINTAH = [
  { label: 'Bupati',       value: 'M. Rizal Intjenae', sub: 'Incumbent since 2021' },
  { label: 'Wakil Bupati', value: 'S. Yansen Pongi',    sub: 'Incumbent since 2021' },
  { label: 'DPRD Members', value: '30',                  sub: 'Regional Parliament seats' },
];

// ─── DATA HASIL PEMILU PER TAHUN ───
const TAHUN_PEMILU = ['2024','2019','2014','2009','2004'];

// ─── OPSI CHART HASIL PEMILU ───
const OPSI_PEMILU = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 10 },
  grid: { left: 40, right: 10, top: 10, bottom: 50 },
  xAxis: { type: 'value', axisLabel: { formatter: (nilaiAxis) => `${nilaiAxis}%` } },
  yAxis: { type: 'category', data: [...TAHUN_PEMILU].reverse(), axisLabel: { fontSize: 10 } },
  series: [
    { name: 'Prabowo', type: 'bar', stack: 'total', data: [60.6, 60.8, 46.9, 44.5, 58.6].reverse(), itemStyle: { color: '#ef4444' }, barMaxWidth: 20 },
    { name: 'Ganjar',  type: 'bar', stack: 'total', data: [26.2, 26.8, 53.1, 55.5, 16.5].reverse(), itemStyle: { color: '#3b82f6' }, barMaxWidth: 20 },
    { name: 'Anies',   type: 'bar', stack: 'total', data: [13.2, 12.4,  0.0,  0.0, 24.9].reverse(), itemStyle: { color: '#22c55e' }, barMaxWidth: 20 },
  ],
};

// ─── DATA ANGGARAN APBD 2025 ───
const DATA_APBD = [
  { label: 'Total APBD',  value: 'Rp 1,42T', colorClass: 'text-teal-700' },
  { label: 'Pendapatan',  value: 'Rp 1,38T', colorClass: 'text-green-600' },
  { label: 'Belanja',     value: 'Rp 1,47T', colorClass: 'text-blue-600'  },
  { label: 'Surplus/Defisit', value: '-Rp 90M', colorClass: 'text-red-500' },
];

// ─── DATA LAYANAN PUBLIK ───
const DATA_LAYANAN_PUBLIK = [
  {
    kategori: 'Education',
    icon: '🎓', borderColor: 'border-blue-200', bgColor: 'bg-blue-50',
    items: ['364 Primary Schools','24 Junior High Schools','12 Senior High Schools','2 Universities'],
  },
  {
    kategori: 'Healthcare',
    icon: '🏥', borderColor: 'border-red-200', bgColor: 'bg-red-50',
    items: ['1 General Hospital','18 Community Health Centers','42 Health Posts','6 Private Clinics'],
  },
  {
    kategori: 'Infrastructure',
    icon: '🏗️', borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50',
    items: ['1,240 km Road Network','3 Main Bridges','8 Irrigation Systems','100% Area Electrification'],
  },
];

// Tab Politik & Pemerintahan
export function CivicsTab() {
  return (
    <ProfileSection>
      <SectionHeader title="Politics &amp; Government" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      {/* ─── Kartu profil pejabat pemerintah ─── */}
      <div>
        <SubSectionHeader title="Government Officials" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-3 gap-4">
          {DATA_PEJABAT_PEMERINTAH.map((itemPejabat) => (
            <div key={itemPejabat.label} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">{itemPejabat.label}</p>
              <p className="font-semibold text-gray-900 mt-1 text-sm leading-snug">{itemPejabat.value}</p>
              <p className="text-[10px] text-gray-400 mt-1">{itemPejabat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Hasil pemilu presidensial ─── */}
      <div>
        <SubSectionHeader title="Election Results" dotColor={COLORS.PRIMARY} />
        <p className="text-[9px] text-gray-500 uppercase mb-3">Presidential Vote Share 2004–2024</p>
        <div className="h-56">
          <ReactECharts option={OPSI_PEMILU} style={{ height: '100%' }} />
        </div>
      </div>

      {/* ─── Kartu APBD 2025 ─── */}
      <div>
        <SubSectionHeader title="Budget APBD 2025" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DATA_APBD.map((itemAnggaran) => (
            <div key={itemAnggaran.label} className="bg-teal-50 border border-teal-100 p-4 rounded-lg">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">{itemAnggaran.label}</p>
              <p className={`text-xl font-black mt-1 ${itemAnggaran.colorClass}`}>{itemAnggaran.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Layanan publik per kategori ─── */}
      <div>
        <SubSectionHeader title="Public Services" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DATA_LAYANAN_PUBLIK.map((itemLayanan) => (
            <div key={itemLayanan.kategori} className={`border ${itemLayanan.borderColor} ${itemLayanan.bgColor} rounded-lg p-4`}>
              <p className="font-bold text-gray-900 text-sm mb-3">
                <span className="mr-2">{itemLayanan.icon}</span>
                {itemLayanan.kategori}
              </p>
              <ul className="space-y-1.5">
                {itemLayanan.items.map((itemDetail) => (
                  <li key={itemDetail} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-teal-500 mt-0.5">•</span>
                    {itemDetail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </ProfileSection>
  );
}
