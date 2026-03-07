import ReactECharts from 'echarts-for-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

// ─── DATA STATISTIK KETENAGAKERJAAN ───
const DATA_STATISTIK_KERJA = [
  { label: 'Total Employed',      value: '126,240', sub: 'active workforce' },
  { label: 'Unemployment Rate',   value: '3.82%',   sub: 'of labor force' },
  { label: 'Labor Participation', value: '59.4%',   sub: 'participation rate' },
];

// ─── OPSI TREEMAP SEKTOR INDUSTRI ───
const OPSI_TREEMAP_INDUSTRI = {
  tooltip: { formatter: (paramItem) => `${paramItem.name}<br/>Workers: ${paramItem.value.toLocaleString()}` },
  series: [{
    type: 'treemap', roam: false, nodeClick: false,
    label: { fontSize: 10 },
    data: [
      { name: 'Agriculture & Forestry', value: 42000, itemStyle: { color: '#22c55e' } },
      { name: 'Manufacturing',          value: 38000, itemStyle: { color: '#3b82f6' } },
      { name: 'Trade & Retail',         value: 31000, itemStyle: { color: '#f59e0b' } },
      { name: 'Education',              value: 18500, itemStyle: { color: '#8b5cf6' } },
      { name: 'Construction',           value: 16200, itemStyle: { color: '#ef4444' } },
      { name: 'Transportation',         value: 12400, itemStyle: { color: '#06b6d4' } },
      { name: 'Healthcare',             value: 9800,  itemStyle: { color: COLORS.PRIMARY } },
      { name: 'Finance',                value: 7300,  itemStyle: { color: '#e11d48' } },
      { name: 'Government',             value: 6100,  itemStyle: { color: '#64748b' } },
      { name: 'Other',                  value: 5200,  itemStyle: { color: '#a8a29e' } },
    ],
  }],
};

// ─── DATA PEKERJAAN TERATAS ───
const DAFTAR_PEKERJAAN = [
  'Farmers','Industrial Workers','Traders','Teachers',
  'Construction Workers','Drivers','Office Staff','Healthcare Workers',
  'Security Personnel','Others',
];

// ─── OPSI CHART BATANG HORIZONTAL PEKERJAAN ───
const OPSI_PEKERJAAN = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 120, right: 20, top: 10, bottom: 20 },
  xAxis: { type: 'value', axisLabel: { fontSize: 9 } },
  yAxis: { type: 'category', data: [...DAFTAR_PEKERJAAN].reverse(), axisLabel: { fontSize: 9 } },
  series: [{
    type: 'bar', barMaxWidth: 14,
    data: [48200,41500,39800,37200,29400,24100,21600,18700,16300,14800].reverse(),
    itemStyle: { color: COLORS.PRIMARY },
  }],
};

// ─── DATA DISTRIBUSI UPAH PER RENTANG ───
const RENTANG_UPAH = ['<Rp1Jt','Rp1-2Jt','Rp2-3Jt','Rp3-5Jt','Rp5-7Jt','Rp7-10Jt','>Rp10Jt'];

// ─── OPSI CHART BATANG BERTUMPUK DISTRIBUSI UPAH ───
const OPSI_DISTRIBUSI_UPAH = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0, itemWidth: 12, itemHeight: 10, textStyle: { fontSize: 10 } },
  grid: { left: 50, right: 10, top: 10, bottom: 50 },
  xAxis: { type: 'category', data: RENTANG_UPAH, axisLabel: { fontSize: 8, interval: 0 } },
  yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
  series: [
    { name: 'Male',   type: 'bar', stack: 'total', data: [8200,21400,28100,19800,6900,3100,1800], itemStyle: { color: '#3b82f6' }, barMaxWidth: 22 },
    { name: 'Female', type: 'bar', stack: 'total', data: [6100,18700,24600,16200,5300,2100,1100], itemStyle: { color: '#f43f5e' }, barMaxWidth: 22 },
  ],
};

// ─── DATA TREN PENDAPATAN TAHUNAN ───
const TAHUN_PENDAPATAN = ['2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023'];

// ─── OPSI CHART TREN PENDAPATAN ───
const OPSI_TREN_PENDAPATAN = {
  tooltip: { trigger: 'axis', formatter: (paramsList) => `${paramsList[0].axisValue}<br/>Rp ${(paramsList[0].value/1000000).toFixed(1)} Jt` },
  grid: { left: 60, right: 10, top: 10, bottom: 30 },
  xAxis: { type: 'category', data: TAHUN_PENDAPATAN, axisLabel: { fontSize: 9 } },
  yAxis: { type: 'value', axisLabel: { fontSize: 9, formatter: (nilaiAxis) => `Rp ${nilaiAxis/1000000}Jt` } },
  series: [{
    type: 'line', smooth: true,
    data: [3200000,3400000,3600000,3800000,4100000,4400000,4600000,4300000,4700000,5100000,5400000],
    lineStyle: { color: COLORS.PRIMARY, width: 2.5 },
    areaStyle: { color: COLORS.PRIMARY_ALPHA },
    itemStyle: { color: COLORS.PRIMARY },
  }],
};

// ─── OPSI TREEMAP PRODUK EKSPOR ───
const OPSI_TREEMAP_EKSPOR = {
  tooltip: { formatter: (paramItem) => `${paramItem.name}<br/>$${paramItem.value}M` },
  series: [{
    type: 'treemap', roam: false, nodeClick: false,
    label: { fontSize: 10 },
    data: [
      { name: 'Minyak Sawit',    value: 42, itemStyle: { color: '#22c55e' } },
      { name: 'Kakao',           value: 18, itemStyle: { color: '#a16207' } },
      { name: 'Beras & Padi',    value: 15, itemStyle: { color: '#f59e0b' } },
      { name: 'Kayu Olahan',     value: 14, itemStyle: { color: '#78350f' } },
      { name: 'Kopi',            value: 12, itemStyle: { color: '#dc2626' } },
      { name: 'Hasil Perikanan', value: 11, itemStyle: { color: '#0ea5e9' } },
      { name: 'Rotan & Bambu',   value: 9,  itemStyle: { color: '#65a30d' } },
      { name: 'Lainnya',         value: 6,  itemStyle: { color: '#9ca3af' } },
    ],
  }],
};

// ─── DATA TIGA INDUSTRI DOMINAN ───
const TIGA_INDUSTRI_DOMINAN = [
  { rank: 1, name: 'Agriculture',  workers: '42,000', share: '33.3%', color: '#22c55e' },
  { rank: 2, name: 'Manufacturing', workers: '38,000', share: '30.1%', color: '#3b82f6' },
  { rank: 3, name: 'Trade',        workers: '31,000', share: '24.6%', color: '#f59e0b' },
];

// Tab Ekonomi & Industri
export function EconomyTab() {
  return (
    <ProfileSection>
      <SectionHeader title="Economy &amp; Industry" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      {/* ─── Kartu ringkasan ketenagakerjaan ─── */}
      <div className="grid grid-cols-3 gap-4">
        {DATA_STATISTIK_KERJA.map((itemStat) => (
          <div key={itemStat.label} className="bg-teal-50 border border-teal-100 p-4 rounded-lg">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">{itemStat.label}</p>
            <p className="text-2xl font-black text-teal-700 mt-1">{itemStat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{itemStat.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Tiga industri terbesar ─── */}
      <div>
        <SubSectionHeader title="Top Industries" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-3 gap-4">
          {TIGA_INDUSTRI_DOMINAN.map((itemIndustri) => (
            <div key={itemIndustri.name} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <span className="text-3xl font-black text-gray-200 leading-none">0{itemIndustri.rank}</span>
              <div>
                <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: itemIndustri.color }} />
                <p className="font-semibold text-gray-900 text-sm">{itemIndustri.name}</p>
                <p className="text-xs text-gray-500">{itemIndustri.workers} workers</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: itemIndustri.color }}>{itemIndustri.share}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Treemap industri & pekerjaan teratas ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-[9px] text-gray-500 uppercase mb-2">Employment by Sector</p>
          <div className="h-60">
            <ReactECharts option={OPSI_TREEMAP_INDUSTRI} style={{ height: '100%' }} />
          </div>
        </div>
        <div>
          <p className="text-[9px] text-gray-500 uppercase mb-2">Top Occupations</p>
          <div className="h-60">
            <ReactECharts option={OPSI_PEKERJAAN} style={{ height: '100%' }} />
          </div>
        </div>
      </div>

      {/* ─── Distribusi upah ─── */}
      <div>
        <SubSectionHeader title="Wages" dotColor={COLORS.PRIMARY} />
        <div className="h-56">
          <ReactECharts option={OPSI_DISTRIBUSI_UPAH} style={{ height: '100%' }} />
        </div>
      </div>

      {/* ─── Tren pendapatan & statistik kemiskinan ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-5 col-span-1">
          <SubSectionHeader title="Income" dotColor={COLORS.PRIMARY} />
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Median Income</p>
              <p className="text-3xl font-black text-teal-600">Rp 4.5Jt</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Gini Coefficient</p>
              <p className="text-2xl font-black text-gray-800">0.412</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Poverty Rate</p>
              <p className="text-2xl font-black text-red-500">11.7%</p>
              <p className="text-xs text-gray-500">≈ 32,000 people</p>
            </div>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 h-48">
          <p className="text-[9px] text-gray-500 uppercase mb-2">Median Income Trend</p>
          <ReactECharts option={OPSI_TREN_PENDAPATAN} style={{ height: '100%' }} />
        </div>
      </div>

      {/* ─── Ekspor & komoditas unggulan ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <SubSectionHeader title="Trade &amp; Exports" dotColor={COLORS.PRIMARY} />
          <div>
            <p className="text-[9px] text-gray-500 uppercase">Total Exports</p>
            <p className="text-3xl font-black text-teal-600">$127M</p>
            <p className="text-xs text-gray-500">USD per year</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase">Top Commodity</p>
            <p className="text-lg font-bold text-gray-900">Minyak Sawit</p>
            <p className="text-xs text-gray-500">33.1% of total exports</p>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 h-56">
          <p className="text-[9px] text-gray-500 uppercase mb-2">Export Products Breakdown</p>
          <ReactECharts option={OPSI_TREEMAP_EKSPOR} style={{ height: '100%' }} />
        </div>
      </div>
    </ProfileSection>
  );
}
