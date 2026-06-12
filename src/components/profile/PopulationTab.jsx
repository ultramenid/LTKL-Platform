import ReactECharts from 'echarts-for-react';
import { COLORS, TOOLTIP_STYLE } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';

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

const populationBarOption = {
  grid: { top: 24, right: 12, bottom: 32, left: 12, containLabel: true },
  tooltip: {
    trigger: 'axis',
    ...TOOLTIP_STYLE,
    formatter: (params) => {
      const year = params[0].axisValue;
      return (
        params
          .map((p) => `${p.marker}${p.seriesName}: <b style="color:#f4f9f8;">${p.value.toLocaleString('id-ID')}</b>`)
          .join('<br/>') + `<br/><span style="color:#8aa8a4;font-size:11px">Tahun ${year}</span>`
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

const householdBarOption = {
  grid: { top: 28, right: 12, bottom: 32, left: 12, containLabel: true },
  tooltip: {
    trigger: 'axis',
    ...TOOLTIP_STYLE,
    formatter: (params) =>
      `Tahun ${params[0].axisValue}<br/>${params[0].marker} <span style="color:#f4f9f8;">Rumah Tangga: <b>${params[0].value.toLocaleString('id-ID')} KK</b></span>`,
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

const expenditureLineOption = {
  grid: { top: 24, right: 48, bottom: 40, left: 48, containLabel: true },
  tooltip: {
    trigger: 'axis',
    ...TOOLTIP_STYLE,
    formatter: (params) =>
      `Tahun ${params[0].axisValue}<br/>${params[0].marker} <span style="color:#f4f9f8;">Pengeluaran: <b>Rp ${params[0].value.toLocaleString('id-ID')}/bulan</b></span>`,
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

const expenditureLineOption2 = {
  grid: { top: 24, right: 48, bottom: 40, left: 48, containLabel: true },
  tooltip: {
    trigger: 'axis',
    ...TOOLTIP_STYLE,
    formatter: (params) =>
      `Tahun ${params[0].axisValue}<br/>${params[0].marker} <span style="color:#f4f9f8;">Pengeluaran: <b>Rp ${params[0].value.toLocaleString('id-ID')}/bulan</b></span>`,
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

const PRODUK_ACCENT = COLORS.PRIMARY;

function ChartPanel({ title, children }) {
  return (
    <div className="border border-coffee-900/15 bg-white p-4">
      <p className="text-[11px] font-bold text-coffee-700 uppercase tracking-[0.15em] mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

export function PopulationTab() {
  return (
    <ProfileSection>
      <div>
        <SectionHeader
          kicker="Produk Unggulan · Populasi"
          title="Kependudukan"
          accent={PRODUK_ACCENT}
        />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 items-start">
          <div className="space-y-4 text-xs text-coffee-700 leading-relaxed">
            <p>
              Jumlah penduduk Kabupaten Sigi mencapai{' '}
              <strong className="text-coffee-900">274.800 jiwa</strong> (2025) dengan tren
              pertumbuhan stabil. Meski angka kemiskinan sempat fluktuatif akibat bencana 2018, saat
              ini menunjukkan tren positif penurunan ke angka{' '}
              <strong className="text-coffee-900">10,47%</strong> (sekitar 26.030 jiwa). Pemerintah
              fokus pada pemberdayaan sektor pertanian untuk menekan angka kemiskinan lebih lanjut.
            </p>
            <p>
              Pengeluaran per rumah tangga Kabupaten Sigi mencerminkan daya beli masyarakat yang
              terus membaik pasca-pandemi dan bencana. Pada tahun 2025, rata-rata pengeluaran per
              rumah tangga diperkirakan mencapai{' '}
              <strong className="text-coffee-900">Rp 1.231.000 per bulan</strong>. Angka ini
              menunjukkan peningkatan kapasitas konsumsi, meskipun mayoritas alokasi belanja masih
              didominasi oleh kebutuhan pokok (makanan).
            </p>
            <p>
              Peningkatan ini selaras dengan pertumbuhan sektor pertanian dan jasa, yang secara
              bertahap mengangkat standar hidup masyarakat di perdesaan maupun area perkotaan.
            </p>
          </div>

          <div className="space-y-5 min-w-0">
            <ChartPanel title="Jumlah Penduduk vs Penduduk Miskin (Jiwa)">
              <ReactECharts option={populationBarOption} style={{ height: 240, width: '100%' }} />
            </ChartPanel>
            <ChartPanel title="Pengeluaran Penduduk per Kapita (Rp/Bulan)">
              <ReactECharts
                option={expenditureLineOption2}
                style={{ height: 100, width: '100%' }}
              />
            </ChartPanel>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Rumah Tangga" accent={PRODUK_ACCENT} />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 items-start">
          <div className="space-y-4 text-xs text-coffee-700 leading-relaxed">
            <p>
              Jumlah rumah tangga di Kabupaten Sigi terus bertumbuh seiring meningkatnya pasangan
              muda, dengan estimasi mencapai <strong className="text-coffee-900">75.200 KK</strong>{' '}
              pada tahun 2025. Rata-rata satu keluarga terdiri dari 3 hingga 4 anggota rumah tangga.
            </p>
            <p>
              Seiring dengan pertumbuhan tersebut, pengeluaran rata-rata per rumah tangga juga
              meningkat menjadi sekitar{' '}
              <strong className="text-coffee-900">Rp 4.493.150 per bulan</strong>. Angka ini
              mencakup total belanja seluruh anggota keluarga untuk kebutuhan pangan, pendidikan,
              dan biaya hidup lainnya. Tren positif ini menunjukkan pergeseran daya beli masyarakat
              yang mulai stabil dan meningkat pasca-rekonstruksi ekonomi wilayah.
            </p>
          </div>

          <div className="space-y-5 min-w-0">
            <ChartPanel title="Jumlah Rumah Tangga">
              <ReactECharts option={householdBarOption} style={{ height: 160, width: '100%' }} />
            </ChartPanel>
            <ChartPanel title="Pengeluaran Rumah Tangga (Rp/Bulan)">
              <ReactECharts option={expenditureLineOption} style={{ height: 100, width: '100%' }} />
            </ChartPanel>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
