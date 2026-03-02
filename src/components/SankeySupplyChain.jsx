import { useRef, useState, useEffect, useMemo } from 'react';
import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';
import { COLORS } from '../config/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// Komponen Sankey interaktif bergaya Trase.earth — layout D3, render React SVG
// Hover pada node meng-highlight SEMUA node dan link yang terhubung (trajectory)
// ─────────────────────────────────────────────────────────────────────────────

// ─── KONSTANTA LAYOUT ───
const TINGGI_CHART       = 620;
// Ruang di atas untuk label kolom header dalam SVG
const PADDING_ATAS_KOLOM = 36;
const LEBAR_NODE         = 100;
const JARAK_NODE         = 14;
// Padding horizontal agar node pertama dan terakhir tidak mepet tepi
const PADDING_KIRI    = 0;
const PADDING_KANAN   = 0;

// ─── DAFTAR TAHUN YANG TERSEDIA UNTUK FILTER ───
const DAFTAR_TAHUN = [2019, 2020, 2021, 2022, 2023];

// ─── LABEL KOLOM HEADER ───
const LABEL_KOLOM = [
  'Province ',
  'Mill group',
  'Exporter',
  'import',
];

// ─── DATA STATIS: NODE RANTAI PASOK CPO INDONESIA 2022 ───
// Setiap node memiliki `depth` untuk memaksa kolom tertentu dalam tata letak
const SANKEY_NODES = [
  // Level 0 — Provinsi produksi utama
  { name: 'Riau'                   },
  { name: 'Kalimantan Tengah'      },
  { name: 'Sumatera Utara'         },
  { name: 'Kalimantan Barat'       },
  { name: 'Sumatera Selatan'       },
  { name: 'Jambi'                  },
  { name: 'Provinsi Lainnya'       },
  // Level 1 — Grup pabrik pengolahan CPO
  { name: 'Wilmar Group'           },
  { name: 'Sinar Mas'              },
  { name: 'Musim Mas Group'        },
  { name: 'Astra Agro Lestari'     },
  { name: 'PTPN III'               },
  { name: 'Pabrik Lainnya'         },
  // Level 2 — Perusahaan eksportir
  { name: 'Wilmar Nabati Indonesia' },
  { name: 'Musim Mas'              },
  { name: 'Sinar Mas Agro'         },
  { name: 'Multimas Nabati'        },
  { name: 'Sumber Indah Perkasa'   },
  { name: 'Eksportir Lainnya'      },
  // Level 3 — Negara tujuan impor
  { name: 'India'                  },
  { name: 'Tiongkok'               },
  { name: 'Pakistan'               },
  { name: 'Bangladesh'             },
  { name: 'Belanda'                },
  { name: 'Amerika Serikat'        },
  { name: 'Negara Lainnya'         },
];

// ─── DATA STATIS: LINK ALIRAN ANTAR NODE — satuan ribu ton CPO ───
const SANKEY_LINKS = [
  // Provinsi → Grup Pabrik
  { source: 'Riau',               target: 'Wilmar Group',       value: 3000 },
  { source: 'Riau',               target: 'Musim Mas Group',    value: 2000 },
  { source: 'Riau',               target: 'Pabrik Lainnya',     value: 2000 },
  { source: 'Kalimantan Tengah',  target: 'Sinar Mas',          value: 2000 },
  { source: 'Kalimantan Tengah',  target: 'Astra Agro Lestari', value: 1500 },
  { source: 'Kalimantan Tengah',  target: 'Pabrik Lainnya',     value: 1500 },
  { source: 'Sumatera Utara',     target: 'Musim Mas Group',    value: 1500 },
  { source: 'Sumatera Utara',     target: 'PTPN III',           value: 1500 },
  { source: 'Sumatera Utara',     target: 'Pabrik Lainnya',     value: 1000 },
  { source: 'Kalimantan Barat',   target: 'Wilmar Group',       value: 1500 },
  { source: 'Kalimantan Barat',   target: 'Sinar Mas',          value: 1000 },
  { source: 'Kalimantan Barat',   target: 'Pabrik Lainnya',     value: 1000 },
  { source: 'Sumatera Selatan',   target: 'Sinar Mas',          value: 1000 },
  { source: 'Sumatera Selatan',   target: 'Astra Agro Lestari', value: 1000 },
  { source: 'Sumatera Selatan',   target: 'Pabrik Lainnya',     value:  500 },
  { source: 'Jambi',              target: 'Musim Mas Group',    value: 1000 },
  { source: 'Jambi',              target: 'Pabrik Lainnya',     value: 1000 },
  { source: 'Provinsi Lainnya',   target: 'Pabrik Lainnya',     value: 1000 },
  { source: 'Provinsi Lainnya',   target: 'PTPN III',           value:  500 },
  { source: 'Provinsi Lainnya',   target: 'Astra Agro Lestari', value:  500 },
  // Grup Pabrik → Eksportir
  { source: 'Wilmar Group',       target: 'Wilmar Nabati Indonesia', value: 4000 },
  { source: 'Wilmar Group',       target: 'Eksportir Lainnya',       value:  500 },
  { source: 'Sinar Mas',          target: 'Sinar Mas Agro',          value: 3500 },
  { source: 'Sinar Mas',          target: 'Eksportir Lainnya',       value:  500 },
  { source: 'Musim Mas Group',    target: 'Musim Mas',               value: 3500 },
  { source: 'Musim Mas Group',    target: 'Eksportir Lainnya',       value: 1000 },
  { source: 'Astra Agro Lestari', target: 'Multimas Nabati',         value: 1500 },
  { source: 'Astra Agro Lestari', target: 'Eksportir Lainnya',       value: 1500 },
  { source: 'PTPN III',           target: 'Sumber Indah Perkasa',    value: 1000 },
  { source: 'PTPN III',           target: 'Eksportir Lainnya',       value: 1000 },
  { source: 'Pabrik Lainnya',     target: 'Wilmar Nabati Indonesia', value: 1500 },
  { source: 'Pabrik Lainnya',     target: 'Multimas Nabati',         value:  500 },
  { source: 'Pabrik Lainnya',     target: 'Sumber Indah Perkasa',    value: 1000 },
  { source: 'Pabrik Lainnya',     target: 'Eksportir Lainnya',       value: 5000 },
  // Eksportir → Negara tujuan
  { source: 'Wilmar Nabati Indonesia', target: 'India',           value: 2000 },
  { source: 'Wilmar Nabati Indonesia', target: 'Tiongkok',        value: 1800 },
  { source: 'Wilmar Nabati Indonesia', target: 'Pakistan',        value:  800 },
  { source: 'Wilmar Nabati Indonesia', target: 'Bangladesh',      value:  500 },
  { source: 'Wilmar Nabati Indonesia', target: 'Belanda',         value:  400 },
  { source: 'Musim Mas',               target: 'India',           value: 1400 },
  { source: 'Musim Mas',               target: 'Tiongkok',        value: 1000 },
  { source: 'Musim Mas',               target: 'Pakistan',        value:  600 },
  { source: 'Musim Mas',               target: 'Bangladesh',      value:  500 },
  { source: 'Sinar Mas Agro',          target: 'Tiongkok',        value: 1500 },
  { source: 'Sinar Mas Agro',          target: 'India',           value: 1000 },
  { source: 'Sinar Mas Agro',          target: 'Belanda',         value:  600 },
  { source: 'Sinar Mas Agro',          target: 'Amerika Serikat', value:  400 },
  { source: 'Multimas Nabati',         target: 'India',           value: 1000 },
  { source: 'Multimas Nabati',         target: 'Bangladesh',      value:  600 },
  { source: 'Multimas Nabati',         target: 'Pakistan',        value:  400 },
  { source: 'Sumber Indah Perkasa',    target: 'India',           value:  800 },
  { source: 'Sumber Indah Perkasa',    target: 'Tiongkok',        value:  700 },
  { source: 'Sumber Indah Perkasa',    target: 'Pakistan',        value:  500 },
  { source: 'Eksportir Lainnya',       target: 'India',           value: 2900 },
  { source: 'Eksportir Lainnya',       target: 'Tiongkok',        value: 2000 },
  { source: 'Eksportir Lainnya',       target: 'Pakistan',        value:  800 },
  { source: 'Eksportir Lainnya',       target: 'Bangladesh',      value:  500 },
  { source: 'Eksportir Lainnya',       target: 'Belanda',         value:  600 },
  { source: 'Eksportir Lainnya',       target: 'Amerika Serikat', value:  600 },
  { source: 'Eksportir Lainnya',       target: 'Negara Lainnya',  value: 2100 },
];

// ─── HELPER: PECAH TEKS PANJANG MENJADI BARIS ───
// Diperlukan karena SVG <text> tidak mendukung word-wrap otomatis
function pecahTeksMenjadiBarisLabel(teksNamaNode, maksKarPerBaris = 13) {
  const kataKata = teksNamaNode.split(' ');
  const barisBaris = [];
  let barisSaatIni = '';
  kataKata.forEach((kataSatu) => {
    const gabungan = barisSaatIni ? `${barisSaatIni} ${kataSatu}` : kataSatu;
    if (gabungan.length <= maksKarPerBaris) {
      barisSaatIni = gabungan;
    } else {
      if (barisSaatIni) barisBaris.push(barisSaatIni);
      barisSaatIni = kataSatu;
    }
  });
  if (barisSaatIni) barisBaris.push(barisSaatIni);
  // Batasi 3 baris maksimum agar tidak meluber keluar node
  return barisBaris.slice(0, 3);
}

// ─── HELPER: BFS TERARAH UNTUK MENEMUKAN NODE YANG TERHUBUNG LEWAT SATU NODE ───
// Penelusuran dibagi dua arah agar tidak "nyebrang" ke cabang lain:
// - Upstream: dari node ke semua leluhur (mengikuti edge terbalik)
// - Downstream: dari node ke semua keturunan (mengikuti edge maju)
// Menggabungkan keduanya memberi set trajectory persis seperti Trase.earth
function cariSemuaNodeTerhubung(namaNodeAwal, semuaLinkKomputasi) {
  // Bangun adjacency list satu arah masing-masing
  const adjacencyMaju    = {};
  const adjacencyMundur  = {};
  semuaLinkKomputasi.forEach((singleLink) => {
    const namaSource = typeof singleLink.source === 'object' ? singleLink.source.name : singleLink.source;
    const namaTarget = typeof singleLink.target === 'object' ? singleLink.target.name : singleLink.target;
    if (!adjacencyMaju[namaSource])   adjacencyMaju[namaSource]   = [];
    if (!adjacencyMundur[namaTarget]) adjacencyMundur[namaTarget] = [];
    adjacencyMaju[namaSource].push(namaTarget);
    adjacencyMundur[namaTarget].push(namaSource);
  });

  // BFS searah — hanya ikuti edge ke satu arah saja
  const bfsTerarah = (namaAwal, adjacency) => {
    const dikunjungi = new Set([namaAwal]);
    const antrian    = [namaAwal];
    while (antrian.length > 0) {
      const namaSaatIni  = antrian.shift();
      const daftarTetangga = adjacency[namaSaatIni] || [];
      daftarTetangga.forEach((namaTetangga) => {
        if (!dikunjungi.has(namaTetangga)) {
          dikunjungi.add(namaTetangga);
          antrian.push(namaTetangga);
        }
      });
    }
    return dikunjungi;
  };

  // Gabungkan hasil penelusuran maju + mundur
  const nodesHilir  = bfsTerarah(namaNodeAwal, adjacencyMaju);
  const nodesHulu   = bfsTerarah(namaNodeAwal, adjacencyMundur);
  return new Set([...nodesHilir, ...nodesHulu]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Komponen utama
// ─────────────────────────────────────────────────────────────────────────────
export function SankeySupplyChain() {
  const refKontainer = useRef(null);
  const [lebarKontainer, setLebarKontainer] = useState(800);

  // State hover node — null berarti tidak ada yang di-hover (semua tampak normal)
  const [namaNodeDiHover, setNamaNodeDiHover] = useState(null);

  // State hover link — menyimpan nama source + target link yang sedang di-hover
  // Dibutuhkan karena hover di atas path link harus juga memicu highlight trajectory
  const [linkDiHover, setLinkDiHover] = useState(null);

  // State filter tahun — default ke tahun terbaru dalam daftar
  const [tahunDipilih, setTahunDipilih] = useState(DAFTAR_TAHUN[DAFTAR_TAHUN.length - 1]);

  // State tooltip — posisi + konten teks
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, konten: '' });

  // Pantau lebar kontainer secara responsif via ResizeObserver
  useEffect(() => {
    const elemenKontainer = refKontainer.current;
    if (!elemenKontainer) return;
    const pengamatUkuran = new ResizeObserver((entries) => {
      const entryPertama = entries[0];
      if (entryPertama) setLebarKontainer(entryPertama.contentRect.width);
    });
    pengamatUkuran.observe(elemenKontainer);
    // Set lebar awal tanpa menunggu event pertama
    setLebarKontainer(elemenKontainer.offsetWidth);
    return () => pengamatUkuran.disconnect();
  }, []);

  // ─── LAYOUT D3 SANKEY ───
  // Hitung posisi node dan jalur link setiap kali lebar kontainer berubah
  // D3 me-mutasi objek input, sehingga deep-clone dilakukan setiap kalkulasi
  const { nodeHasil, linkHasil } = useMemo(() => {
    if (lebarKontainer < 100) return { nodeHasil: [], linkHasil: [] };

    const generatorSankey = sankey()
      .nodeId((nodeItem) => nodeItem.name)
      // sankeyLeft: kolom diurutkan berdasarkan kedalaman minimal dari sumber
      .nodeAlign(sankeyLeft)
      .nodeWidth(LEBAR_NODE)
      .nodePadding(JARAK_NODE)
      .extent([[PADDING_KIRI, PADDING_ATAS_KOLOM], [lebarKontainer - PADDING_KANAN, TINGGI_CHART]]);

    const hasilLayout = generatorSankey({
      nodes: SANKEY_NODES.map((nodeSatu) => ({ ...nodeSatu })),
      links: SANKEY_LINKS.map((linkSatu) => ({ ...linkSatu })),
    });

    return { nodeHasil: hasilLayout.nodes, linkHasil: hasilLayout.links };
  }, [lebarKontainer]);

  // ─── POSISI KOLOM UNTUK LABEL HEADER ───
  // Hitung center-x dan x0 setiap kolom (layer) dari node hasil D3
  // Dipakai untuk menempatkan label tepat di atas masing-masing kolom bar
  const posisiKolom = useMemo(() => {
    if (!nodeHasil.length) return [];
    // Kelompokkan node berdasarkan layer (depth)
    const pemetaanLayer = {};
    nodeHasil.forEach((singleNode) => {
      const layer = singleNode.layer ?? singleNode.depth ?? 0;
      if (!pemetaanLayer[layer]) pemetaanLayer[layer] = [];
      pemetaanLayer[layer].push(singleNode);
    });
    return Object.keys(pemetaanLayer)
      .map(Number)
      .sort((a, b) => a - b)
      .map((layer) => {
        const nodesLayer = pemetaanLayer[layer];
        // Semua node dalam layer yang sama memiliki x0 dan x1 yang identik
        const x0 = nodesLayer[0].x0;
        const x1 = nodesLayer[0].x1;
        return { layer, x0, x1, tengahX: (x0 + x1) / 2 };
      });
  }, [nodeHasil]);

  // ─── TRAJECTORY BFS SAAT HOVER NODE ───
  // Hanya aktif saat hover di atas node — hover link tidak memicu BFS
  const kumpulanNodeTerhubung = useMemo(() => {
    if (!namaNodeDiHover) return null;
    return cariSemuaNodeTerhubung(namaNodeDiHover, linkHasil);
  }, [namaNodeDiHover, linkHasil]);

  // Tentukan apakah node termasuk dalam trajectory yang sedang di-highlight
  const apakahNodeDiHighlight = (namaNode) =>
    !kumpulanNodeTerhubung || kumpulanNodeTerhubung.has(namaNode);

  // Tentukan apakah link termasuk dalam trajectory yang sedang di-highlight
  const apakahLinkDiHighlight = (singleLink) => {
    if (!kumpulanNodeTerhubung) return true;
    const namaSource = typeof singleLink.source === 'object' ? singleLink.source.name : singleLink.source;
    const namaTarget = typeof singleLink.target === 'object' ? singleLink.target.name : singleLink.target;
    return kumpulanNodeTerhubung.has(namaSource) && kumpulanNodeTerhubung.has(namaTarget);
  };

  // ─── HANDLER TOOLTIP ───
  const tampilkanTooltipNode = (event, namaNode) => {
    // Hitung total volume masuk ke node tersebut sebagai konteks
    const volumeMasuk = linkHasil
      .filter((singleLink) => {
        const namaTarget = typeof singleLink.target === 'object' ? singleLink.target.name : singleLink.target;
        return namaTarget === namaNode;
      })
      .reduce((total, singleLink) => total + singleLink.value, 0);
    const volumeKeluar = linkHasil
      .filter((singleLink) => {
        const namaSource = typeof singleLink.source === 'object' ? singleLink.source.name : singleLink.source;
        return namaSource === namaNode;
      })
      .reduce((total, singleLink) => total + singleLink.value, 0);
    const volumeTampil = volumeMasuk > 0 ? volumeMasuk : volumeKeluar;
    setTooltip({
      visible:  true,
      x:        event.clientX,
      y:        event.clientY,
      konten:   `${namaNode}${volumeTampil > 0 ? `\n${volumeTampil.toLocaleString()} ribu ton` : ''}`,
    });
  };

  const tampilkanTooltipLink = (event, singleLink) => {
    const namaSource = typeof singleLink.source === 'object' ? singleLink.source.name : singleLink.source;
    const namaTarget = typeof singleLink.target === 'object' ? singleLink.target.name : singleLink.target;
    setTooltip({
      visible: true,
      x:       event.clientX,
      y:       event.clientY,
      konten:  `${namaSource} → ${namaTarget}\n${singleLink.value.toLocaleString()} ribu ton`,
    });
  };

  const sembunyikanTooltip = () => setTooltip((sebelumnya) => ({ ...sebelumnya, visible: false }));

  // Perbarui posisi tooltip saat mouse bergerak di atas elemen SVG
  const perbaruiPosisiTooltip = (event) => {
    if (tooltip.visible) {
      setTooltip((sebelumnya) => ({ ...sebelumnya, x: event.clientX, y: event.clientY }));
    }
  };

  // ─── RENDER ───
  return (
    <div ref={refKontainer} className="w-full border border-gray-200 rounded-xl overflow-hidden">

      {/* ─── TOOLBAR ATAS: filter tahun + tombol download bergaya Trase.earth ─── */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-end gap-3">
        {/* Filter tahun — dropdown pill */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium">Year</span>
          <div className="relative">
            <select
              value={tahunDipilih}
              onChange={(pilihan) => setTahunDipilih(Number(pilihan.target.value))}
              className="appearance-none pl-3 pr-7 py-1.5 text-[12px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-gray-400 transition focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': COLORS.PRIMARY }}
            >
              {DAFTAR_TAHUN.map((tahunItem) => (
                <option key={tahunItem} value={tahunItem}>{tahunItem}</option>
              ))}
            </select>
            {/* Ikon chevron manual agar tampil konsisten lintas browser */}
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Tombol Download Selection */}
        <button
          className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md hover:border-gray-400 transition cursor-pointer"
        >
          Download selection
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-400">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ─── LABEL KOLOM: garis panjang dengan panah antar kolom bergaya Trase.earth ─── */}
      {/* Dihapus — label kini dirender di dalam SVG sesuai posisi kolom D3 */}

      {/* Area chart SVG — label kolom dirender di baris paling atas */}
      <div className="bg-white w-full select-none">
        <svg
          width={lebarKontainer}
          height={TINGGI_CHART}
          onMouseMove={perbaruiPosisiTooltip}
          onMouseLeave={() => {
            setNamaNodeDiHover(null);
            setLinkDiHover(null);
            sembunyikanTooltip();
          }}
        >
          {/* ─── LABEL KOLOM HEADER + GARIS PANAH ─── */}
          {/* Dirender pertama agar berada di layer paling bawah SVG */}
          {posisiKolom.map((kolom, indeksKolom) => (
            <g key={`header-kolom-${kolom.layer}`}>
              {/* Label teks kolom tepat di tengah bar */}
              <text
                x={kolom.tengahX}
                y={16}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fontFamily="inherit"
                fill={COLORS.PRIMARY}
                letterSpacing="0.08em"
                style={{ textTransform: 'uppercase' }}
              >
                {LABEL_KOLOM[indeksKolom]?.toUpperCase()}
              </text>
              {/* Garis horizontal + panah menuju kolom berikutnya */}
              {indeksKolom < posisiKolom.length - 1 && (() => {
                const xGarisMulai  = kolom.x1 + 6;
                const xGarisSampai = posisiKolom[indeksKolom + 1].x0 - 10;
                const yGaris       = 15;
                return (
                  <g>
                    <line
                      x1={xGarisMulai}
                      y1={yGaris}
                      x2={xGarisSampai}
                      y2={yGaris}
                      stroke="#d1d5db"
                      strokeWidth={1}
                    />
                    {/* Kepala panah di ujung kanan garis */}
                    <path
                      d={`M${xGarisSampai} ${yGaris - 4} L${xGarisSampai + 7} ${yGaris} L${xGarisSampai} ${yGaris + 4}`}
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })()}
            </g>
          ))}
          {/* ─── LINK (aliran) ─── */}
          {linkHasil.map((singleLink, indeksLink) => {
            const namaSourceLink  = typeof singleLink.source === 'object' ? singleLink.source.name : singleLink.source;
            const namaTargetLink  = typeof singleLink.target === 'object' ? singleLink.target.name : singleLink.target;

            // Tiga kondisi highlight link:
            // 1. Hover node → link dalam trajectory berubah PRIMARY
            // 2. Hover link langsung → hanya link ini saja yang PRIMARY
            // 3. Idle → semua abu-abu
            const adalahLinkDiHover = linkDiHover
              && linkDiHover.source === namaSourceLink
              && linkDiHover.target === namaTargetLink;
            const adalahTrajectoryNode = namaNodeDiHover !== null && apakahLinkDiHighlight(singleLink);
            const diHighlight     = adalahLinkDiHover || adalahTrajectoryNode;
            const adaHoverApapun  = namaNodeDiHover !== null || linkDiHover !== null;
            const warna           = diHighlight ? COLORS.PRIMARY : '#d1d5db';
            const opasitas        = diHighlight ? 0.75 : adaHoverApapun ? 0.06 : 0.4;
            const lebarStroke     = Math.max(1, singleLink.width);
            return (
              <path
                key={`link-${indeksLink}-${namaSourceLink}-${namaTargetLink}`}
                d={sankeyLinkHorizontal()(singleLink)}
                fill="none"
                stroke={warna}
                strokeWidth={lebarStroke}
                style={{ opacity: opasitas, cursor: 'crosshair', transition: 'stroke 0.2s, opacity 0.2s' }}
                onMouseEnter={(event) => {
                  setLinkDiHover({ source: namaSourceLink, target: namaTargetLink });
                  tampilkanTooltipLink(event, singleLink);
                }}
                onMouseLeave={() => {
                  setLinkDiHover(null);
                  sembunyikanTooltip();
                }}
              />
            );
          })}

          {/* ─── NODE (blok persegi panjang) ─── */}
          {nodeHasil.map((singleNode) => {
            // Saat tidak ada hover: semua node abu-abu (idle)
            // Hanya hover node yang memicu highlight trajectory — hover link tidak mengubah warna node
            const adaHover     = namaNodeDiHover !== null;
            const diHighlight  = apakahNodeDiHighlight(singleNode.name);
            // Idle: putih dengan border abu-abu; highlighted: solid PRIMARY
            const warnaFill    = adaHover && diHighlight ? COLORS.PRIMARY : '#ffffff';
            const warnaBorder  = adaHover && diHighlight ? COLORS.PRIMARY : '#d1d5db';
            const warnaLabel   = adaHover && diHighlight ? '#ffffff' : '#6b7280';
            const tinggiNode   = Math.max(4, singleNode.y1 - singleNode.y0);
            const tengahX      = (singleNode.x0 + singleNode.x1) / 2;
            const tengahY      = singleNode.y0 + tinggiNode / 2;
            const barisLabel   = pecahTeksMenjadiBarisLabel(singleNode.name);
            // Ukuran font adaptif: kurangi jika baris banyak atau node kecil
            const ukuranFont   = tinggiNode < 30 ? 8 : barisLabel.length > 2 ? 8 : 9;
            const jarakAntarBaris = ukuranFont + 3;

            return (
              <g
                key={`node-${singleNode.name}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(event) => {
                  setNamaNodeDiHover(singleNode.name);
                  tampilkanTooltipNode(event, singleNode.name);
                }}
                onMouseLeave={() => {
                  setNamaNodeDiHover(null);
                  sembunyikanTooltip();
                }}
              >
                {/* Persegi panjang node */}
                <rect
                  x={singleNode.x0}
                  y={singleNode.y0}
                  width={singleNode.x1 - singleNode.x0}
                  height={tinggiNode}
                  fill={warnaFill}
                  stroke={warnaBorder}
                  strokeWidth={1}
                  style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                />
                {/* Label teks multi-baris — hanya tampil jika node cukup tinggi */}
                {tinggiNode >= 20 && (
                  <text textAnchor="middle" dominantBaseline="auto" pointerEvents="none">
                    {barisLabel.map((barisTeks, indeksBaris) => {
                      // Offset vertikal agar semua baris terpusat di tengah node
                      const totalTinggiTeks = barisLabel.length * jarakAntarBaris - 3;
                      const offsetY = tengahY - totalTinggiTeks / 2 + indeksBaris * jarakAntarBaris + ukuranFont;
                      return (
                        <tspan
                          key={`label-${singleNode.name}-${indeksBaris}`}
                          x={tengahX}
                          y={offsetY}
                          fontSize={ukuranFont}
                          fontWeight={600}
                          fontFamily="inherit"
                          fill={warnaLabel}
                          style={{ transition: 'fill 0.2s' }}
                        >
                          {barisTeks}
                        </tspan>
                      );
                    })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer sumber data */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2">
        <p className="text-[10px] text-gray-400 text-right">
          Satuan: ribu ton CPO &nbsp;·&nbsp; Tahun: {tahunDipilih} &nbsp;·&nbsp; Sumber: Trase.earth
        </p>
      </div>

      {/* Tooltip floating — mengikuti posisi kursor via fixed positioning */}
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-xl text-xs leading-relaxed"
          style={{
            left:            tooltip.x + 14,
            top:             tooltip.y - 10,
            backgroundColor: 'rgba(15,23,42,0.95)',
            borderColor:     COLORS.PRIMARY,
            borderWidth:     1,
            borderStyle:     'solid',
            color:           '#f1f5f9',
            whiteSpace:      'pre-wrap',
            minWidth:        160,
            maxWidth:        280,
          }}
        >
          {tooltip.konten.split('\n').map((barisTeks, indeksBaris) => (
            <span
              key={indeksBaris}
              style={{
                display:    'block',
                fontWeight: indeksBaris === 0 ? 700 : 400,
                color:      indeksBaris === 0 ? COLORS.PRIMARY : '#cbd5e1',
              }}
            >
              {barisTeks}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
