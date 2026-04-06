import ReactECharts from 'echarts-for-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader } from './ProfileSection.jsx';

// ─── DATA KEPENDUDUKAN KABUPATEN SIGI 2015–2025 ───
const POPULATION_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const POPULATION_TOTAL  = [228255, 232233, 236050, 239742, 243490, 258811, 261311, 264136, 268230, 271500, 274800];
const POPULATION_POOR   = [29810,  29540,  30120,  31430,  30680,  31250,  32740,  31290,  31180,  30850,  30500];
const EXPENDITURE_PCAP  = [2876472, 3027840, 3178622, 3254320, 3386124, 3549236, 3643008, 3846740, 4060294, 4277200, 4493150];
const HOUSEHOLD_TOTAL   = [59133, 60477, 61793, 63090, 64415, 66520, 68050, 69509, 71800, 73378, 75200];

// ─── DATA PDRB ADHK KABUPATEN SIGI 2015–2025 (Miliar Rupiah) ───
// Gradasi oranye — 2015 paling terang, 2025 paling gelap agar tren waktu terbaca visual
const PDRB_TAHUN_WARNA = [
  '#fde8c8','#fcd9a8','#fbc07a','#f9a84c','#f78e22',
  '#e27516','#c7610d','#ab4d08','#8e3a05','#712a02','#5a1e01',
];

const PDRB_SEKTORS = [
  { nama: 'Pertanian, Kehutanan, dan Perikanan',                    nilai: [2394,2627,2857,2444,2767,3051,3330,3638,3974,4341,4740] },
  { nama: 'Konstruksi',                                             nilai: [670,738,801,672,764,846,926,1013,1109,1213,1326] },
  { nama: 'Administrasi Pemerintahan, Pertahanan & Jaminan Sosial', nilai: [460,509,555,466,529,587,643,704,770,843,921] },
  { nama: 'Perdagangan Besar & Eceran; Reparasi Kendaraan',        nilai: [353,390,425,357,405,450,493,540,590,646,707] },
  { nama: 'Jasa Pendidikan',                                        nilai: [323,358,392,330,375,416,456,500,547,600,656] },
  { nama: 'Industri Pengolahan',                                    nilai: [239,263,285,244,277,306,335,367,401,439,480] },
  { nama: 'Transportasi dan Pergudangan',                           nilai: [155,172,189,157,179,199,218,239,261,286,313] },
  { nama: 'Jasa Keuangan dan Asuransi',                             nilai: [141,157,172,144,164,183,201,220,241,264,289] },
  { nama: 'Jasa Kesehatan dan Kegiatan Sosial',                     nilai: [108,120,132,110,125,140,153,167,183,201,220] },
  { nama: 'Informasi dan Komunikasi',                               nilai: [60,71,83,80,96,108,125,145,168,194,225] },
  { nama: 'Real Estate',                                            nilai: [94,104,114,96,109,121,132,145,158,173,190] },
  { nama: 'Pertambangan dan Penggalian',                            nilai: [80,89,98,82,94,104,115,127,139,153,168] },
  { nama: 'Jasa Lainnya',                                           nilai: [82,91,101,84,96,106,117,128,140,154,168] },
  { nama: 'Penyediaan Akomodasi dan Makan Minum',                   nilai: [57,64,69,57,65,73,80,87,96,105,115] },
  { nama: 'Jasa Perusahaan',                                        nilai: [24,26,28,24,27,31,33,37,40,44,48] },
  { nama: 'Pengadaan Listrik dan Gas',                              nilai: [12,13,15,12,14,16,17,20,21,24,26] },
  { nama: 'Pengadaan Air, Pengelolaan Sampah & Daur Ulang',         nilai: [7,8,8,7,8,9,9,10,12,13,14] },
];

// Dibalik agar sektor terbesar muncul di baris atas chart (ECharts kategori mulai dari bawah)
const PDRB_SEKTORS_REVERSED = [...PDRB_SEKTORS].reverse();

const OPSI_PDRB_BAR = {
  grid: { top: 16, right: 16, bottom: 56, left: 8, containLabel: true },
  tooltip: {
    trigger: 'item',
    formatter: (param) =>
      `<b>${param.name}</b><br/>${param.marker}${param.seriesName}: <b>Rp ${param.value.toLocaleString('id-ID')} M</b>`,
  },
  legend: {
    bottom: 0,
    data: POPULATION_YEARS.map(String),
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { fontSize: 9 },
  },
  xAxis: {
    type: 'value',
    axisLabel: { fontSize: 9, formatter: (nilai) => nilai >= 1000 ? (nilai / 1000).toFixed(1) + 'T' : nilai + 'M' },
  },
  yAxis: {
    type: 'category',
    data: PDRB_SEKTORS_REVERSED.map((sektor) => sektor.nama),
    axisLabel: { fontSize: 9, width: 210, overflow: 'truncate' },
  },
  series: POPULATION_YEARS.map((tahun, indeksTahun) => ({
    name: String(tahun),
    type: 'bar',
    stack: 'total',
    barMaxWidth: 20,
    data: PDRB_SEKTORS_REVERSED.map((sektor) => sektor.nilai[indeksTahun]),
    itemStyle: { color: PDRB_TAHUN_WARNA[indeksTahun] },
  })),
};

// ─── OPSI CHART: STACKED BAR PENDUDUK VS PENDUDUK MISKIN ───
const populationBarOption = {
  grid: { top: 24, right: 12, bottom: 32, left: 12, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const year = params[0].axisValue;
      return params.map((p) => `${p.marker}${p.seriesName}: <b>${p.value.toLocaleString('id-ID')}</b>`).join('<br/>') +
        `<br/><span style="color:#9ca3af;font-size:11px">Tahun ${year}</span>`;
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
      label: { show: true, position: 'inside', fontSize: 9, color: '#fff', formatter: (p) => (p.value / 1000).toFixed(0) + 'K' },
    },
    {
      name: 'Jumlah Penduduk',
      type: 'bar',
      stack: 'total',
      data: POPULATION_TOTAL,
      itemStyle: { color: COLORS.PRIMARY },
      label: { show: true, position: 'insideTop', fontSize: 9, color: '#fff', formatter: (p) => (p.value / 1000).toFixed(0) + 'K' },
    },
  ],
};

// ─── OPSI CHART: BAR JUMLAH RUMAH TANGGA ───
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
      label: { show: true, position: 'top', fontSize: 9, color: '#374151', formatter: (p) => p.value.toLocaleString('id-ID') },
    },
  ],
};

// ─── OPSI CHART: LINE PENGELUARAN PER KAPITA ───
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
      label: { show: true, fontSize: 9, color: '#374151', formatter: (p) => 'Rp ' + (p.value / 1000000).toFixed(1) + 'Jt' },
    },
  ],
};


// Tab Kependudukan & Keragaman
export function PopulationTab() {
  return (
    <ProfileSection>
      <SectionHeader title="Kependudukan" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">

        {/* ─── KOLOM KIRI: NARASI ───*/}
        <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
          <p>
            Jumlah penduduk Kabupaten Sigi mencapai <strong className="text-gray-800">274.800 jiwa</strong> (2025)
            dengan tren pertumbuhan stabil. Meski angka kemiskinan sempat fluktuatif akibat bencana 2018,
            saat ini menunjukkan tren positif penurunan ke angka <strong className="text-gray-800">10,47%</strong>{' '}
            (sekitar 26.030 jiwa). Pemerintah fokus pada pemberdayaan sektor pertanian untuk menekan
            angka kemiskinan lebih lanjut.
          </p>
          <p>
            Pengeluaran per rumah tangga Kabupaten Sigi mencerminkan daya beli masyarakat yang terus membaik
            pasca-pandemi dan bencana. Pada tahun 2025, rata-rata pengeluaran per rumah tangga diperkirakan
            mencapai <strong className="text-gray-800">Rp 4.493.150 per bulan</strong>. Angka ini menunjukkan
            peningkatan kapasitas konsumsi, meskipun mayoritas alokasi belanja masih didominasi oleh
            kebutuhan pokok (makanan).
          </p>
          <p>
            Peningkatan ini selaras dengan pertumbuhan sektor pertanian dan jasa, yang secara bertahap
            mengangkat standar hidup masyarakat di perdesaan maupun area perkotaan.
          </p>
        </div>

        {/* ─── KOLOM KANAN: DUA CHART ───*/}
        <div className="space-y-6 min-w-0">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              <span style={{ color: COLORS.PRIMARY }}>Jumlah Penduduk</span>
              {' '}vs{' '}
              <span className="text-amber-500">Penduduk Miskin (Jiwa)</span>
            </p>
            <ReactECharts option={populationBarOption} style={{ height: 240, width: '100%' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-2">Pengeluaran penduduk per kapita (Rp/Bulan)</p>
            <ReactECharts option={expenditureLineOption} style={{ height:100, width: '100%' }} />
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
              Jumlah rumah tangga di Kabupaten Sigi terus bertumbuh seiring meningkatnya pasangan muda,
              dengan estimasi mencapai <strong className="text-gray-800">75.200 KK</strong> pada tahun 2025.
              Rata-rata satu keluarga terdiri dari 3 hingga 4 anggota rumah tangga.
            </p>
            <p>
              Seiring dengan pertumbuhan tersebut, pengeluaran rata-rata per rumah tangga juga meningkat menjadi
              sekitar <strong className="text-gray-800">Rp 4.493.150 per bulan</strong>. Angka ini mencakup total
              belanja seluruh anggota keluarga untuk kebutuhan pangan, pendidikan, dan biaya hidup lainnya.
              Tren positif ini menunjukkan pergeseran daya beli masyarakat yang mulai stabil dan meningkat
              pasca-rekonstruksi ekonomi wilayah.
            </p>
          </div>

          {/* dua chart */}
          <div className="space-y-6 min-w-0">
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#16a34a' }}>Jumlah Rumah Tangga</p>
              <ReactECharts option={householdBarOption} style={{ height: 160, width: '100%' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2">Pengeluaran Rumah Tangga (Rp/Bulan)</p>
              <ReactECharts option={expenditureLineOption} style={{ height: 100, width: '100%' }} />
            </div>
          </div>

        </div>
      </div>

      {/* ─── SECTION: PDRB ─── */}
      <div>
        <SectionHeader title="PDRB" borderColor="#f59e0b" dotColor="#f59e0b" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start mt-6">

          {/* narasi */}
          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <p>
              PDRB Kabupaten Sigi menunjukkan struktur ekonomi yang sangat bergantung pada kekayaan
              alam dan aktivitas agraris. Pada tahun 2024, nilai PDRB Sigi diperkirakan mencapai{' '}
              <strong className="text-gray-800">Rp 9,7 Triliun</strong>, yang dihasilkan dari
              kontribusi 17 sektor lapangan usaha.
            </p>
            <p>
              <strong className="text-gray-800">Kontribusi Dominan Sektor Pertanian:</strong>{' '}
              Sektor Pertanian, Kehutanan, dan Perikanan merupakan tulang punggung utama ekonomi
              Sigi dengan kontribusi dominan mencapai <strong className="text-gray-800">45%</strong>{' '}
              hingga 48% dari total PDRB.
            </p>
            <p>
              <strong className="text-gray-800">Basis Komoditas Unggulan:</strong> Sigi merupakan
              salah satu lumbung pangan Sulawesi Tengah, dengan komoditas utama seperti padi,
              jagung, serta tanaman perkebunan seperti kakao dan kopi.
            </p>
            <p>
              <strong className="text-gray-800">Penyerap Tenaga Kerja Terbesar:</strong> Mayoritas
              penduduk di 176 desa bekerja di sektor agraris, sehingga aktivitas ekonomi rumah
              tangga sangat bergantung pada hasil panen. Geografis yang mendukung: wilayah seperti
              Lembah Palolo dan Kulawi memiliki lahan subur yang mendukung produktivitas tinggi.
            </p>
          </div>

          {/* chart horizontal bar */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-600 mb-3">Produk Domestik Regional Bruto (ADHK)</p>
            <ReactECharts option={OPSI_PDRB_BAR} style={{ height: 480, width: '100%' }} />
          </div>

        </div>
      </div>

    </ProfileSection>
  );
}

