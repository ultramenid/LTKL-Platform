import ReactECharts from 'echarts-for-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

// ─── DATA POPULASI PER KECAMATAN ───
const DATA_POPULASI_LOKASI = [
  { name: 'Sigi Biromaru', pop: '41,200', pct: 15.0 },
  { name: 'Dolo',          pop: '28,500', pct: 10.4 },
  { name: 'Biromaru',      pop: '24,100', pct: 8.8  },
  { name: 'Palolo',        pop: '21,800', pct: 7.9  },
  { name: 'Tanambulava',   pop: '18,300', pct: 6.7  },
];

// ─── DATA GRUP USIA UNTUK PIRAMIDA ───
const KELOMPOK_USIA = ['0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','75+'];
const NILAI_LAKI_LAKI = [8.2, 8.5, 8.8, 9.1, 10.2, 11.4, 12.1, 11.8, 11.2, 10.6, 9.8, 9.0, 7.8, 6.2, 4.4, 3.8];
const NILAI_PEREMPUAN = [7.9, 8.1, 8.6, 8.9,  9.8, 11.0, 12.3, 12.0, 11.5, 10.9, 10.2, 9.5, 8.4, 6.9, 5.2, 5.8];

// ─── OPSI CHART PIRAMIDA PENDUDUK ───
const OPSI_PIRAMIDA = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (paramsList) => {
      const dataPerempuan = paramsList.find((paramItem) => paramItem.seriesName === 'Female');
      const dataLakiLaki  = paramsList.find((paramItem) => paramItem.seriesName === 'Male');
      return `${paramsList[0].axisValue}<br/>Female: ${dataPerempuan ? dataPerempuan.value : 0}%<br/>Male: ${dataLakiLaki ? Math.abs(dataLakiLaki.value) : 0}%`;
    },
  },
  legend: { data: ['Male', 'Female'], bottom: 0, textStyle: { fontSize: 11 } },
  grid: { left: 52, right: 40, top: 10, bottom: 36 },
  xAxis: { type: 'value', axisLabel: { formatter: (nilaiAxis) => `${Math.abs(nilaiAxis)}%` } },
  yAxis: { type: 'category', data: KELOMPOK_USIA, axisLabel: { fontSize: 10 } },
  series: [
    { name: 'Male',   type: 'bar', stack: 'total', data: NILAI_LAKI_LAKI.map((nilaiItem) => -nilaiItem), itemStyle: { color: '#3b82f6' }, barMaxWidth: 18 },
    { name: 'Female', type: 'bar', stack: 'total', data: NILAI_PEREMPUAN, itemStyle: { color: '#f43f5e' }, barMaxWidth: 18 },
  ],
};

// ─── DATA TREN ETNIS PER TAHUN ───
const TAHUN_ETNIS = ['2015','2016','2017','2018','2019','2020','2021','2022','2023'];

// ─── OPSI CHART BATANG BERTUMPUK ETNIS ───
const OPSI_TREN_ETNIS = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 12 },
  grid: { left: 40, right: 20, top: 10, bottom: 60 },
  xAxis: { type: 'category', data: TAHUN_ETNIS, axisLabel: { fontSize: 10 } },
  yAxis: { type: 'value', axisLabel: { formatter: (nilaiAxis) => `${nilaiAxis}k` } },
  series: [
    { name: 'Bugis',   type: 'bar', stack: 's', data: [22,23,24,25,26,27,28,29,30], itemStyle: { color: '#ef4444' } },
    { name: 'Jawa',    type: 'bar', stack: 's', data: [35,36,37,38,39,40,41,42,43], itemStyle: { color: '#3b82f6' } },
    { name: 'Toraja',  type: 'bar', stack: 's', data: [18,19,20,21,22,23,24,25,26], itemStyle: { color: '#22c55e' } },
    { name: 'Sunda',   type: 'bar', stack: 's', data: [12,12,13,13,14,14,15,15,16], itemStyle: { color: '#f59e0b' } },
    { name: 'Lainnya', type: 'bar', stack: 's', data: [8, 8, 9, 9,10,10,11,11,12],  itemStyle: { color: '#8b5cf6' } },
  ],
};

// ─── DATA KOMPOSISI ETNIS 2025 ───
const KOMPOSISI_ETNIS = [
  { name: 'Bugis',   pct: 35.2, color: '#ef4444' },
  { name: 'Jawa',    pct: 28.1, color: '#3b82f6' },
  { name: 'Toraja',  pct: 18.4, color: '#22c55e' },
  { name: 'Sunda',   pct: 10.6, color: '#f59e0b' },
  { name: 'Lainnya', pct: 7.7,  color: '#8b5cf6' },
];

// ─── DATA TREN MIGRAN ───
const TAHUN_TREND = ['2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023'];

// ─── OPSI CHART TREN MIGRAN ───
const OPSI_MIGRAN = {
  tooltip: { trigger: 'axis' },
  grid: { left: 56, right: 20, top: 10, bottom: 30 },
  xAxis: { type: 'category', data: TAHUN_TREND, axisLabel: { fontSize: 10 } },
  yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: (nilaiAxis) => `${nilaiAxis}%` } },
  series: [{
    type: 'line', smooth: true,
    data: [7.1, 7.3, 7.6, 7.9, 8.0, 8.1, 8.3, 8.4, 8.4, 8.5, 8.5],
    lineStyle: { color: COLORS.HIGHLIGHT, width: 2.5 },
    areaStyle: { color: COLORS.HIGHLIGHT_ALPHA },
    itemStyle: { color: COLORS.HIGHLIGHT },
  }],
};

// ─── DATA BAHASA DI RUMAH ───
const DATA_BAHASA = [
  { lang: 'Bahasa Indonesia', pct: '72.1%', color: '#ef4444' },
  { lang: 'Bugis',            pct: '12.4%', color: '#3b82f6' },
  { lang: 'Jawa',             pct: '9.1%',  color: '#22c55e' },
  { lang: 'Toraja',           pct: '6.4%',  color: '#f59e0b' },
];

// ─── DATA RINGKASAN DEMOGRAFIS ───
const DATA_RINGKASAN_DEMO = [
  { label: 'Urban Population',   value: '58.2%' },
  { label: 'Rural Population',   value: '41.8%' },
  { label: 'Population Density', value: '34/km²' },
];

// Tab Kependudukan & Keragaman
export function PopulationTab() {
  return (
    <ProfileSection>
      <SectionHeader title="Population &amp; Diversity" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      {/* ─── Populasi per kecamatan ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Population by Location</h3>
          <div className="space-y-1 text-xs">
            {DATA_POPULASI_LOKASI.map((itemLokasi) => (
              <div key={itemLokasi.name}>
                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
                  <span>{itemLokasi.name}</span>
                  <span className="font-semibold text-gray-900">{itemLokasi.pop}</span>
                </div>
                <div className="w-full h-1 bg-gray-100 mt-0.5">
                  <div className="h-1 bg-teal-400" style={{ width: `${itemLokasi.pct * 4}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 bg-gray-100 rounded-lg flex items-center justify-center h-52 text-gray-400 text-sm border border-gray-200 border-dashed">
          <span>[ District Choropleth Map ]</span>
        </div>
      </div>

      {/* ─── Piramida usia & jenis kelamin ─── */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-5">Residents by Gender &amp; Age</h3>
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-full md:w-40 space-y-5 md:shrink-0 pt-2">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">Female</p>
              <p className="text-3xl font-black" style={{ color: COLORS.HIGHLIGHT }}>49.6%</p>
              <p className="text-xs text-gray-500 mt-0.5">136,200 people</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">Male</p>
              <p className="text-3xl font-black text-teal-600">50.4%</p>
              <p className="text-xs text-gray-500 mt-0.5">138,600 people</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">Median Age</p>
              <p className="text-3xl font-black text-gray-900">34.2</p>
            </div>
          </div>
          <div className="w-full h-60 md:h-80">
            <ReactECharts option={OPSI_PIRAMIDA} style={{ height: '100%' }} />
          </div>
        </div>
      </div>

      {/* ─── Kewarganegaraan & asal-usul ─── */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Citizenship &amp; Origin</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Native Born</p>
              <p className="text-3xl font-black text-teal-600">91.5%</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Migrants</p>
              <p className="text-3xl font-black" style={{ color: COLORS.HIGHLIGHT }}>8.5%</p>
            </div>
          </div>
          <div className="col-span-1 md:col-span-3">
            <div className="w-full bg-gray-200 rounded h-5 overflow-hidden flex">
              <div className="h-5 bg-teal-500" style={{ width: '91.5%' }} />
              <div className="h-5 flex-1" style={{ backgroundColor: COLORS.HIGHLIGHT }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Native Born 91.5%</span>
              <span>Migrants 8.5%</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {DATA_RINGKASAN_DEMO.map((itemDemo) => (
                <div key={itemDemo.label} className="bg-gray-50 border border-gray-200 p-3 rounded text-xs">
                  <p className="text-gray-500 text-[9px] uppercase">{itemDemo.label}</p>
                  <p className="font-bold text-gray-900 text-base mt-1">{itemDemo.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Keragaman etnis ─── */}
      <div>
        <SubSectionHeader title="Diversity" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-[9px] text-gray-500 uppercase mb-3">Ethnic Groups Over Time</p>
            <div className="h-60">
              <ReactECharts option={OPSI_TREN_ETNIS} style={{ height: '100%' }} />
            </div>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase mb-3">Composition 2025</p>
            <div className="space-y-2.5">
              {KOMPOSISI_ETNIS.map((itemEtnis) => (
                <div key={itemEtnis.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700">{itemEtnis.name}</span>
                    <span className="font-semibold">{itemEtnis.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded h-3">
                    <div className="h-3 rounded" style={{ width: `${itemEtnis.pct}%`, backgroundColor: itemEtnis.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tren populasi migran ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <SubSectionHeader title="Migrants" dotColor={COLORS.HIGHLIGHT} />
          <div>
            <p className="text-[9px] text-gray-500 uppercase">Share of Population</p>
            <p className="text-3xl font-black" style={{ color: COLORS.HIGHLIGHT }}>8.5%</p>
            <p className="text-xs text-gray-500 mt-1">≈ 23,358 people</p>
          </div>
          <div className="text-xs text-gray-600 space-y-1 pt-2">
            <p>• East Java origin: 42%</p>
            <p>• South Sulawesi: 28%</p>
            <p>• Other regions: 30%</p>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 h-48">
          <p className="text-[9px] text-gray-500 uppercase mb-2">Migrant Share Trend (%)</p>
          <ReactECharts option={OPSI_MIGRAN} style={{ height: '100%' }} />
        </div>
      </div>

      {/* ─── Bahasa yang digunakan di rumah ─── */}
      <div className="bg-teal-50 border border-teal-100 rounded-lg p-6">
        <SubSectionHeader title="Languages at Home" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DATA_BAHASA.map((itemBahasa) => (
            <div key={itemBahasa.lang} className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: itemBahasa.color }}>
                {itemBahasa.pct.replace('%', '')}%
              </div>
              <p className="text-xs text-gray-600 mt-2">{itemBahasa.lang}</p>
              <p className="text-sm font-bold text-gray-900">{itemBahasa.pct}</p>
            </div>
          ))}
        </div>
      </div>
    </ProfileSection>
  );
}
