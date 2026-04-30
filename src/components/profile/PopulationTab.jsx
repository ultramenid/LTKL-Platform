import ReactECharts from 'echarts-for-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader } from './ProfileSection.jsx';

// ─── POPULATION DATA KABUPATEN SIGI 2015–2025 ───
const POPULATION_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const POPULATION_TOTAL = [
  228255, 232233, 236050, 239742, 243490, 258811, 261311, 264136, 268230, 271500, 274800,
];
const POPULATION_POOR = [
  29810, 29540, 30120, 31430, 30680, 31250, 32740, 31290, 31180, 30850, 30500,
];
const EXPENDITURE_PCAP = [
  2876472, 3027840, 3178622, 3254320, 3386124, 3549236, 3643008, 3846740, 4060294, 4277200, 4493150,
];
const EXPENDITURE_RT = [
  745200, 788500, 832100, 856400, 895800, 912400, 948700, 1012300, 1085600, 1156000, 1231000,
];
const HOUSEHOLD_TOTAL = [
  59133, 60477, 61793, 63090, 64415, 66520, 68050, 69509, 71800, 73378, 75200,
];

// ─── CHART OPTIONS: STACKED BAR TOTAL VS POOR POPULATION ───
const populationBarOption = {
  grid: { top: 24, right: 12, bottom: 32, left: 12, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const year = params[0].axisValue;
      return (
        params
          .map((p) => `${p.marker}${p.seriesName}: <b>${p.value.toLocaleString('id-ID')}</b>`)
          .join('<br/>') + `<br/><span style="color:#9ca3af;font-size:11px">Tahun ${year}</span>`
      );
    },
  },
  legend: { top: 0, right: 0, textStyle: { fontSize: 11 } },
  xAxis: {
    type: 'category',
    data: POPULATION_YEARS,
    axisLabel: { fontSize: 10 },
  },
  yAxis: { type: 'value', show: false },
  series: [
    {
      name: 'Penduduk Miskin',
      type: 'bar',
      stack: 'total',
      data: POPULATION_POOR,
      itemStyle: { color: '#f59e0b' },
      label: {
        show: true,
        position: 'inside',
        fontSize: 9,
        color: '#fff',
        formatter: (p) => (p.value / 1000).toFixed(0) + 'K',
      },
    },
    {
      name: 'Jumlah Penduduk',
      type: 'bar',
      stack: 'total',
      data: POPULATION_TOTAL,
      itemStyle: { color: COLORS.PRIMARY },
      label: {
        show: true,
        position: 'insideTop',
        fontSize: 9,
        color: '#fff',
        formatter: (p) => (p.value / 1000).toFixed(0) + 'K',
      },
    },
  ],
};

// ─── CHART OPTIONS: BAR HOUSEHOLD COUNT ───
const householdBarOption = {
  grid: { top: 28, right: 12, bottom: 32, left: 12, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) =>
      `Tahun ${params[0].axisValue}<br/>${params[0].marker} Rumah Tangga: <b>${params[0].value.toLocaleString('id-ID')} KK</b>`,
  },
  xAxis: { type: 'category', data: POPULATION_YEARS, axisLabel: { fontSize: 10 } },
  yAxis: { type: 'value', show: false },
  series: [
    {
      name: 'Jumlah Rumah Tangga',
      type: 'bar',
      data: HOUSEHOLD_TOTAL,
      itemStyle: { color: '#4ade80' },
      label: {
        show: true,
        position: 'top',
        fontSize: 9,
        color: '#374151',
        formatter: (p) => p.value.toLocaleString('id-ID'),
      },
    },
  ],
};

// ─── CHART OPTIONS: LINE PER CAPITA EXPENDITURE ───
const expenditureLineOption = {
  grid: { top: 24, right: 48, bottom: 40, left: 48, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) =>
      `Tahun ${params[0].axisValue}<br/>${params[0].marker} Pengeluaran: <b>Rp ${params[0].value.toLocaleString('id-ID')}/bulan</b>`,
  },
  xAxis: {
    type: 'category',
    data: POPULATION_YEARS,
    axisLabel: { fontSize: 10 },
    boundaryGap: false,
  },
  yAxis: { type: 'value', show: false },
  series: [
    {
      name: 'Pengeluaran Per Kapita',
      type: 'line',
      data: EXPENDITURE_PCAP,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 2.5 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { color: 'rgba(59,130,246,0.08)' },
      label: {
        show: true,
        fontSize: 9,
        color: '#374151',
        formatter: (p) => 'Rp ' + (p.value / 1000000).toFixed(1) + 'Jt',
      },
    },
  ],
};

// ─── CHART OPTIONS: LINE PER CAPITA EXPENDITURE ───
const expenditureLineOption2 = {
  grid: { top: 24, right: 48, bottom: 40, left: 48, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) =>
      `Tahun ${params[0].axisValue}<br/>${params[0].marker} Pengeluaran: <b>Rp ${params[0].value.toLocaleString('id-ID')}/bulan</b>`,
  },
  xAxis: {
    type: 'category',
    data: POPULATION_YEARS,
    axisLabel: { fontSize: 10 },
    boundaryGap: false,
  },
  yAxis: { type: 'value', show: false },
  series: [
    {
      name: 'Pengeluaran Per Kapita',
      type: 'line',
      data: EXPENDITURE_RT,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 2.5 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { color: 'rgba(59,130,246,0.08)' },
      label: {
        show: true,
        fontSize: 9,
        color: '#374151',
        formatter: (p) => 'Rp ' + (p.value / 1000000).toFixed(1) + 'Jt',
      },
    },
  ],
};

// Population & Diversity tab
export function PopulationTab() {
  return (
    <ProfileSection>
      <SectionHeader title="Kependudukan" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
        {/* ─── KOLOM KIRI: NARASI ───*/}
        <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
          <p>
            Jumlah penduduk Kabupaten Sigi mencapai{' '}
            <strong className="text-gray-800">274.800 jiwa</strong> (2025) dengan tren pertumbuhan
            stabil. Meski angka kemiskinan sempat fluktuatif akibat bencana 2018, saat ini
            menunjukkan tren positif penurunan ke angka{' '}
            <strong className="text-gray-800">10,47%</strong> (sekitar 26.030 jiwa). Pemerintah
            fokus pada pemberdayaan sektor pertanian untuk menekan angka kemiskinan lebih lanjut.
          </p>
          <p>
            Pengeluaran per rumah tangga Kabupaten Sigi mencerminkan daya beli masyarakat yang terus
            membaik pasca-pandemi dan bencana. Pada tahun 2025, rata-rata pengeluaran per rumah
            tangga diperkirakan mencapai{' '}
            <strong className="text-gray-800">Rp 1.231.000 per bulan</strong>. Angka ini menunjukkan
            peningkatan kapasitas konsumsi, meskipun mayoritas alokasi belanja masih didominasi oleh
            kebutuhan pokok (makanan).
          </p>
          <p>
            Peningkatan ini selaras dengan pertumbuhan sektor pertanian dan jasa, yang secara
            bertahap mengangkat standar hidup masyarakat di perdesaan maupun area perkotaan.
          </p>
        </div>

        {/* ─── KOLOM KANAN: DUA CHART ───*/}
        <div className="space-y-6 min-w-0">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              <span style={{ color: COLORS.PRIMARY }}>Jumlah Penduduk</span> vs{' '}
              <span className="text-amber-500">Penduduk Miskin (Jiwa)</span>
            </p>
            <ReactECharts option={populationBarOption} style={{ height: 240, width: '100%' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-2">
              Pengeluaran penduduk per kapita (Rp/Bulan)
            </p>
            <ReactECharts option={expenditureLineOption2} style={{ height: 100, width: '100%' }} />
          </div>
        </div>
      </div>
      {/* ─── SECTION: RUMAH TANGGA ─── */}
      <div>
        <SectionHeader title="Rumah Tangga" borderColor="#4ade80" dotColor="#4ade80" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start mt-6">
          {/* narasi */}
          <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
            <p>
              Jumlah rumah tangga di Kabupaten Sigi terus bertumbuh seiring meningkatnya pasangan
              muda, dengan estimasi mencapai <strong className="text-gray-800">75.200 KK</strong>{' '}
              pada tahun 2025. Rata-rata satu keluarga terdiri dari 3 hingga 4 anggota rumah tangga.
            </p>
            <p>
              Seiring dengan pertumbuhan tersebut, pengeluaran rata-rata per rumah tangga juga
              meningkat menjadi sekitar{' '}
              <strong className="text-gray-800">Rp 4.493.150 per bulan</strong>. Angka ini mencakup
              total belanja seluruh anggota keluarga untuk kebutuhan pangan, pendidikan, dan biaya
              hidup lainnya. Tren positif ini menunjukkan pergeseran daya beli masyarakat yang mulai
              stabil dan meningkat pasca-rekonstruksi ekonomi wilayah.
            </p>
          </div>

          {/* dua chart */}
          <div className="space-y-6 min-w-0">
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#16a34a' }}>
                Jumlah Rumah Tangga
              </p>
              <ReactECharts option={householdBarOption} style={{ height: 160, width: '100%' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2">
                Pengeluaran Rumah Tangga (Rp/Bulan)
              </p>
              <ReactECharts option={expenditureLineOption} style={{ height: 100, width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
