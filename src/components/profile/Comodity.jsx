import ReactECharts from 'echarts-for-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

// ─── DATA DUMMY PRODUKSI KOMODITAS UNGGULAN 2015–2025 (Ton) ───
const COMMODITY_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// Data produksi 5 komoditas utama dalam ton
const COMMODITY_PRODUCTION = [
  { name: 'Kakao',   color: '#92400e', data: [12400, 13100, 13800, 11200, 14200, 15100, 15800, 16900, 17800, 18600, 19500] },
  { name: 'Padi',    color: COLORS.PRIMARY, data: [98000, 102000, 107000, 89000, 110000, 114000, 118000, 123000, 128000, 133000, 138000] },
  { name: 'Jagung',  color: '#f59e0b', data: [34000, 36500, 39000, 31000, 41000, 43500, 46000, 49000, 52000, 55000, 58000] },
  { name: 'Kopi',    color: '#78350f', data: [4200,  4600,  5000,  4100,  5300,  5700,  6100,  6600,  7100,  7600,  8100]  },
  { name: 'Kelapa',  color: '#65a30d', data: [8900,  9400,  9900,  8200,  10400, 11000, 11600, 12300, 13000, 13700, 14400] },
];

// Data luas panen per komoditas dalam hektar
const HARVEST_AREA = [
  { name: 'Kakao',   color: '#92400e', data: [5200, 5400, 5600, 4800, 5900, 6200, 6500, 6900, 7200, 7600, 7900] },
  { name: 'Padi',    color: COLORS.PRIMARY, data: [18000, 18800, 19500, 16500, 20200, 21000, 21800, 22700, 23600, 24500, 25400] },
  { name: 'Jagung',  color: '#f59e0b', data: [8500, 9000, 9600, 7800, 10200, 10800, 11400, 12100, 12800, 13500, 14200] },
  { name: 'Kopi',    color: '#78350f', data: [2100, 2200, 2400, 2000, 2500, 2700, 2900, 3100, 3300, 3500, 3700] },
  { name: 'Kelapa',  color: '#65a30d', data: [3800, 3950, 4100, 3600, 4300, 4500, 4700, 4950, 5200, 5450, 5700] },
];

// ─── OPSI CHART: LINE TREN PRODUKSI PER KOMODITAS ───
const productionTrendOption = {
  grid: { top: 32, right: 16, bottom: 40, left: 12, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const year = params[0].axisValue;
      const rows = params
        .map((p) => `${p.marker} ${p.seriesName}: <b>${p.value.toLocaleString('id-ID')} ton</b>`)
        .join('<br/>');
      return `<span style="color:#9ca3af;font-size:10px">Tahun ${year}</span><br/>${rows}`;
    },
  },
  legend: {
    top: 0,
    right: 0,
    textStyle: { fontSize: 10 },
    itemWidth: 12,
    itemHeight: 8,
  },
  xAxis: {
    type: 'category',
    data: COMMODITY_YEARS,
    axisLabel: { fontSize: 10 },
    boundaryGap: false,
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: COMMODITY_PRODUCTION.map((commodity) => ({
    name: commodity.name,
    type: 'line',
    data: commodity.data,
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    lineStyle: { color: commodity.color, width: 2 },
    itemStyle: { color: commodity.color },
    areaStyle: { color: commodity.color, opacity: 0.06 },
  })),
};

// ─── OPSI CHART: BAR PRODUKSI TAHUN TERAKHIR (2025) ───
// Bar horizontal untuk mempermudah perbandingan antar komoditas
const latestProductionOption = {
  grid: { top: 8, right: 60, bottom: 8, left: 8, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) =>
      `${params[0].marker} ${params[0].name}: <b>${params[0].value.toLocaleString('id-ID')} ton</b>`,
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      fontSize: 9,
      formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
    },
  },
  yAxis: {
    type: 'category',
    data: [...COMMODITY_PRODUCTION].reverse().map((c) => c.name),
    axisLabel: { fontSize: 10 },
  },
  series: [
    {
      type: 'bar',
      barMaxWidth: 28,
      // Ambil nilai 2025 (indeks terakhir) per komoditas, dibalik sesuai urutan y-axis
      data: [...COMMODITY_PRODUCTION].reverse().map((commodity) => ({
        value: commodity.data[commodity.data.length - 1],
        itemStyle: { color: commodity.color, borderRadius: [0, 4, 4, 0] },
      })),
      label: {
        show: true,
        position: 'right',
        fontSize: 9,
        color: '#6b7280',
        formatter: (p) => `${(p.value / 1000).toFixed(1)}K`,
      },
    },
  ],
};

// ─── OPSI CHART: GROUPED BAR LUAS PANEN VS PRODUKSI (indeks produktivitas) ───
// Menampilkan rasio ton/ha per komoditas sebagai proxy produktivitas lahan
const productivityOption = {
  grid: { top: 32, right: 16, bottom: 40, left: 12, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const year = params[0].axisValue;
      // Hitung produktivitas (ton/ha) dari dua series pertama
      const prod = params.find((p) => p.seriesName === 'Produksi (ton)');
      const area = params.find((p) => p.seriesName === 'Luas Panen (ha)');
      const ratio = prod && area && area.value > 0
        ? (prod.value / area.value).toFixed(2)
        : '-';
      return (
        `<span style="color:#9ca3af;font-size:10px">Tahun ${year}</span><br/>` +
        params.map((p) => `${p.marker} ${p.seriesName}: <b>${p.value.toLocaleString('id-ID')}</b>`).join('<br/>') +
        `<br/><span style="color:#14b8a6;font-size:10px">Produktivitas: <b>${ratio} ton/ha</b></span>`
      );
    },
  },
  legend: { top: 0, right: 0, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 8 },
  xAxis: { type: 'category', data: COMMODITY_YEARS, axisLabel: { fontSize: 10 }, boundaryGap: false },
  yAxis: { type: 'value', show: false },
  series: [
    {
      name: 'Produksi (ton)',
      type: 'bar',
      // Gunakan Padi (indeks 1) sebagai komoditas representatif
      data: COMMODITY_PRODUCTION[1].data,
      barMaxWidth: 20,
      itemStyle: { color: COLORS.PRIMARY, borderRadius: [3, 3, 0, 0] },
    },
    {
      name: 'Luas Panen (ha)',
      type: 'bar',
      data: HARVEST_AREA[1].data,
      barMaxWidth: 20,
      itemStyle: { color: COLORS.HIGHLIGHT, borderRadius: [3, 3, 0, 0] },
    },
  ],
};

// ─── OPSI CHART: DONUT KOMPOSISI KOMODITAS (% dari total produksi 2025) ───
const totalProduction2025 = COMMODITY_PRODUCTION.reduce(
  (sum, commodity) => sum + commodity.data[commodity.data.length - 1],
  0
);

const compositionDonutOption = {
  tooltip: {
    trigger: 'item',
    formatter: (param) =>
      `${param.marker} ${param.name}<br/><b>${param.value.toLocaleString('id-ID')} ton</b> (${param.percent}%)`,
  },
  legend: {
    orient: 'vertical',
    right: 8,
    top: 'middle',
    textStyle: { fontSize: 10 },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      name: 'Komposisi Produksi',
      type: 'pie',
      radius: ['42%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 11, fontWeight: 'bold' },
      },
      data: COMMODITY_PRODUCTION.map((commodity) => ({
        name: commodity.name,
        value: commodity.data[commodity.data.length - 1],
        itemStyle: { color: commodity.color },
      })),
    },
  ],
};

// Ringkasan statistik komoditas unggulan untuk kartu summary di atas
const COMMODITY_SUMMARY_STATS = [
  { label: 'Komoditas Unggulan', value: 'Padi',   unit: '138.000 ton (2025)'   },
  { label: 'Total Produksi',     value: '238K',   unit: 'ton semua komoditas'  },
  { label: 'Luas Panen Total',   value: '56.9K',  unit: 'hektar (2025)'        },
  { label: 'Produktivitas Padi', value: '5.43',   unit: 'ton/ha'               },
];

// Tab Komoditas — tren produksi, komposisi, dan produktivitas lahan
export function CommodityTab() {
  return (
    <ProfileSection>
      <SectionHeader title="Komoditas Unggulan" borderColor="#92400e" dotColor="#92400e" />

      {/* ─── KARTU SUMMARY STATISTIK ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {COMMODITY_SUMMARY_STATS.map((stat) => (
          <div key={stat.label} className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* ─── SECTION: TREN PRODUKSI ─── */}
      <div>
        <SubSectionHeader title="Tren Produksi Komoditas (2015–2025)" dotColor="#92400e" />
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 items-start">

          {/* Narasi */}
          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <p>
              Kabupaten Sigi dikenal sebagai lumbung pangan Sulawesi Tengah dengan{' '}
              <strong className="text-gray-800">Padi</strong> sebagai komoditas utama yang menyumbang
              lebih dari <strong className="text-gray-800">57%</strong> total produksi pertanian.
              Produksi padi terus meningkat dari 98.000 ton (2015) menuju estimasi{' '}
              <strong className="text-gray-800">138.000 ton</strong> pada 2025.
            </p>
            <p>
              <strong className="text-gray-800">Kakao</strong> dan <strong className="text-gray-800">Jagung</strong>{' '}
              menjadi komoditas perkebunan unggulan berikutnya. Produktivitas kakao meningkat signifikan
              pascabencana berkat program rehabilitasi kebun yang dijalankan pemerintah daerah bersama
              mitra swasta.
            </p>
            <p>
              <strong className="text-gray-800">Kopi</strong> dan <strong className="text-gray-800">Kelapa</strong>{' '}
              masih menjadi sumber pendapatan penting bagi petani di wilayah dataran tinggi
              Kulawi dan Lore Utara, meski volume absolutnya lebih kecil.
            </p>
          </div>

          {/* Chart bar produksi terbaru */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Produksi 2025 per Komoditas</p>
            <ReactECharts option={latestProductionOption} style={{ height: 180, width: '100%' }} />
          </div>
        </div>

        {/* Chart tren line — full width */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-600 mb-2">Tren Produksi 2015–2025 (ton)</p>
          <ReactECharts option={productionTrendOption} style={{ height: 240, width: '100%' }} />
        </div>
      </div>

      {/* ─── SECTION: PRODUKTIVITAS & KOMPOSISI ─── */}
      <div>
        <SubSectionHeader title="Produktivitas & Komposisi" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Chart produktivitas padi */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">
              Produksi vs Luas Panen —{' '}
              <span style={{ color: COLORS.PRIMARY }}>Padi</span>
            </p>
            <p className="text-[10px] text-gray-400 mb-2">
              Selisih antara batang biru dan hijau menggambarkan efisiensi lahan per tahun
            </p>
            <ReactECharts option={productivityOption} style={{ height: 200, width: '100%' }} />
          </div>

          {/* Chart donut komposisi */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">
              Komposisi Produksi 2025
            </p>
            <p className="text-[10px] text-gray-400 mb-2">
              Total: {totalProduction2025.toLocaleString('id-ID')} ton dari 5 komoditas utama
            </p>
            <ReactECharts option={compositionDonutOption} style={{ height: 200, width: '100%' }} />
          </div>

        </div>
      </div>

    </ProfileSection>
  );
}
