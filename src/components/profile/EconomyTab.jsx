import ReactECharts from 'echarts-for-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';
// ─── SIGI DISTRICT GDP ADHK DATA 2015–2025 (Billion IDR) ───
// Orange gradient — 2015 lightest, 2025 darkest so time trends are visually readable
const GDP_YEAR_COLORS = [
  '#fde8c8',
  '#fcd9a8',
  '#fbc07a',
  '#f9a84c',
  '#f78e22',
  '#e27516',
  '#c7610d',
  '#ab4d08',
  '#8e3a05',
  '#712a02',
  '#5a1e01',
];

const GDP_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const GDP_SECTORS = [
  {
    name: 'Pertanian, Kehutanan, dan Perikanan',
    values: [2394, 2627, 2857, 2444, 2767, 3051, 3330, 3638, 3974, 4341, 4740],
  },
  { name: 'Konstruksi', values: [670, 738, 801, 672, 764, 846, 926, 1013, 1109, 1213, 1326] },
  {
    name: 'Administrasi Pemerintahan, Pertahanan & Jaminan Sosial',
    values: [460, 509, 555, 466, 529, 587, 643, 704, 770, 843, 921],
  },
  {
    name: 'Perdagangan Besar & Eceran; Reparasi Kendaraan',
    values: [353, 390, 425, 357, 405, 450, 493, 540, 590, 646, 707],
  },
  { name: 'Jasa Pendidikan', values: [323, 358, 392, 330, 375, 416, 456, 500, 547, 600, 656] },
  { name: 'Industri Pengolahan', values: [239, 263, 285, 244, 277, 306, 335, 367, 401, 439, 480] },
  {
    name: 'Transportasi dan Pergudangan',
    values: [155, 172, 189, 157, 179, 199, 218, 239, 261, 286, 313],
  },
  {
    name: 'Jasa Keuangan dan Asuransi',
    values: [141, 157, 172, 144, 164, 183, 201, 220, 241, 264, 289],
  },
  {
    name: 'Jasa Kesehatan dan Kegiatan Sosial',
    values: [108, 120, 132, 110, 125, 140, 153, 167, 183, 201, 220],
  },
  { name: 'Informasi dan Komunikasi', values: [60, 71, 83, 80, 96, 108, 125, 145, 168, 194, 225] },
  { name: 'Real Estate', values: [94, 104, 114, 96, 109, 121, 132, 145, 158, 173, 190] },
  {
    name: 'Pertambangan dan Penggalian',
    values: [80, 89, 98, 82, 94, 104, 115, 127, 139, 153, 168],
  },
  { name: 'Jasa Lainnya', values: [82, 91, 101, 84, 96, 106, 117, 128, 140, 154, 168] },
  {
    name: 'Penyediaan Akomodasi dan Makan Minum',
    values: [57, 64, 69, 57, 65, 73, 80, 87, 96, 105, 115],
  },
  { name: 'Jasa Perusahaan', values: [24, 26, 28, 24, 27, 31, 33, 37, 40, 44, 48] },
  { name: 'Pengadaan Listrik dan Gas', values: [12, 13, 15, 12, 14, 16, 17, 20, 21, 24, 26] },
  {
    name: 'Pengadaan Air, Pengelolaan Sampah & Daur Ulang',
    values: [7, 8, 8, 7, 8, 9, 9, 10, 12, 13, 14],
  },
];

// Reversed so largest sector appears at the top of the chart (ECharts categories start from bottom)
const GDP_SECTORS_REVERSED = [...GDP_SECTORS].reverse();

const GDP_BAR_CHART_OPTION = {
  grid: { top: 16, right: 16, bottom: 56, left: 8, containLabel: true },
  tooltip: {
    trigger: 'item',
    formatter: (param) =>
      `<b>${param.name}</b><br/>${param.marker}${param.seriesName}: <b>Rp ${param.value.toLocaleString('id-ID')} M</b>`,
  },
  legend: {
    bottom: 0,
    data: GDP_YEARS.map(String),
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { fontSize: 9 },
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      fontSize: 9,
      formatter: (axisValue) =>
        axisValue >= 1000 ? (axisValue / 1000).toFixed(1) + 'T' : axisValue + 'M',
    },
  },
  yAxis: {
    type: 'category',
    data: GDP_SECTORS_REVERSED.map((sectorRecord) => sectorRecord.name),
    axisLabel: { fontSize: 9, width: 210, overflow: 'truncate' },
  },
  series: GDP_YEARS.map((year, yearIndex) => ({
    name: String(year),
    type: 'bar',
    stack: 'total',
    barMaxWidth: 20,
    data: GDP_SECTORS_REVERSED.map((sectorRecord) => sectorRecord.values[yearIndex]),
    itemStyle: { color: GDP_YEAR_COLORS[yearIndex] },
  })),
};

// Tab Ekonomi & Industri
export function EconomyTab() {
  return (
    <ProfileSection>
      {/* ─── SECTION: PDRB ─── */}
      <div>
        <SectionHeader title="PDRB" borderColor="#f59e0b" dotColor="#f59e0b" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start mt-6">
          {/* Narrative column */}
          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <p>
              PDRB Kabupaten Sigi menunjukkan struktur ekonomi yang sangat bergantung pada kekayaan
              alam dan aktivitas agraris. Pada tahun 2024, nilai PDRB Sigi diperkirakan mencapai{' '}
              <strong className="text-gray-800">Rp 9,7 Triliun</strong>, yang dihasilkan dari
              kontribusi 17 sektor lapangan usaha.
            </p>
            <p>
              <strong className="text-gray-800">Kontribusi Dominan Sektor Pertanian:</strong> Sektor
              Pertanian, Kehutanan, dan Perikanan merupakan tulang punggung utama ekonomi Sigi
              dengan kontribusi dominan mencapai <strong className="text-gray-800">45%</strong>{' '}
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

          {/* Horizontal bar chart */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-600 mb-3">
              Produk Domestik Regional Bruto (ADHK)
            </p>
            <ReactECharts option={GDP_BAR_CHART_OPTION} style={{ height: 480, width: '100%' }} />
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
