import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ─── BACA CSV (baca file supply chain data source) ───
const csvPath = join(process.cwd(), 'src/data/palmoil.csv');
const csvContent = readFileSync(csvPath, 'utf-8');
const csvLines = csvContent.trim().split('\n');

// Header dan data rows
const csvHeader = csvLines[0].split(';');
const csvData = csvLines.slice(1);

// Mapping kolom (map CSV columns to indices)
const colIndexYear = csvHeader.indexOf('Year');
const colIndexDistrict = csvHeader.indexOf('Kabupaten of production');
const colIndexMillGroup = csvHeader.indexOf('Mill group');
const colIndexExporterGroup = csvHeader.indexOf('Exporter group');
const colIndexCountryFirstImport = csvHeader.indexOf('Country of first import');
const colIndexTradeVolume = csvHeader.indexOf('Trade volume');

console.log(`📖 Membaca CSV: ${csvData.length} baris data`);
console.log(`Kolom: Year(${colIndexYear}), District(${colIndexDistrict}), Mill(${colIndexMillGroup}), Exporter(${colIndexExporterGroup}), Country(${colIndexCountryFirstImport}), Volume(${colIndexTradeVolume})`);

// ─── AGREGASI DATA BERDASARKAN KABUPATEN + TAHUN ───
const dataByDistrictYear = {};

csvData.forEach((row, idx) => {
  const columns = row.split(';');
  const year = columns[colIndexYear]?.trim();
  const district = columns[colIndexDistrict]?.trim();
  const millGroup = columns[colIndexMillGroup]?.trim() || 'UNKNOWN';
  const exporterGroup = columns[colIndexExporterGroup]?.trim() || 'UNKNOWN';
  const countryFirstImport = columns[colIndexCountryFirstImport]?.trim() || 'UNKNOWN';
  const tradeVolume = parseFloat(columns[colIndexTradeVolume]?.trim()) || 0;

  // Skip jika data tidak lengkap
  if (!year || !district) return;

  // Inisialisasi struktur
  if (!dataByDistrictYear[district]) dataByDistrictYear[district] = {};
  if (!dataByDistrictYear[district][year]) {
    dataByDistrictYear[district][year] = {
      flows: [], // Setiap flow adalah (mill, exporter, country, volume)
    };
  }

  dataByDistrictYear[district][year].flows.push({
    mill: millGroup,
    exporter: exporterGroup,
    country: countryFirstImport,
    volume: tradeVolume,
  });

  if ((idx + 1) % 10000 === 0) console.log(`  ✓ ${idx + 1}/${csvData.length} baris diproses`);
});

console.log(`✓ Agregasi selesai untuk ${Object.keys(dataByDistrictYear).length} district\n`);

// ─── FUNGSI: BANGUN NODES + LINKS DARI FLOW ───
const MAX_NODES_PER_LAYER = 6;

function buildSankeyData(flowList) {
  // Agregasi flow: (mill → exporter → country) dengan volume
  const aggregatedFlows = {};
  flowList.forEach(({ mill, exporter, country, volume }) => {
    const key = `${mill}||${exporter}||${country}`;
    aggregatedFlows[key] = (aggregatedFlows[key] || 0) + volume;
  });

  // Hitung volume per tier (layer)
  const volumeTierDistrictMill = {};   // mill → total volume
  const volumeTierMillExporter = {};   // exporter → total volume
  const volumeTierExporterCountry = {} // country → total volume

  Object.entries(aggregatedFlows).forEach(([key, volume]) => {
    const [mill, exporter, country] = key.split('||');
    volumeTierDistrictMill[mill] = (volumeTierDistrictMill[mill] || 0) + volume;
    volumeTierMillExporter[exporter] = (volumeTierMillExporter[exporter] || 0) + volume;
    volumeTierExporterCountry[country] = (volumeTierExporterCountry[country] || 0) + volume;
  });

  // Top-N per layer, sisanya → "Lainnya"
  const topCountries = Object.entries(volumeTierExporterCountry)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_NODES_PER_LAYER)
    .map(([name]) => name);
  const topMills = Object.entries(volumeTierDistrictMill)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_NODES_PER_LAYER)
    .map(([name]) => name);
  const topExporters = Object.entries(volumeTierMillExporter)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_NODES_PER_LAYER)
    .map(([name]) => name);

  // Helper: normalize nama ke top-N atau "Lainnya"
  const normalizeName = (name, topList) => {
    return topList.includes(name) ? name : 'Lainnya';
  };

  // Bangun nodes + links
  const nodes = [];
  const linkSet = new Set();
  const nodeIdSet = new Set();

  // Layer 0: District (placeholder, tidak ada di CSV, jadi kita set ke district name nanti)
  // Layer 1: Mill groups
  // Layer 2: Exporters
  // Layer 3: Countries

  // Proses setiap flow aggregated
  Object.entries(aggregatedFlows).forEach(([key, volume]) => {
    const [mill, exporter, country] = key.split('||');
    const normalizedMill = normalizeName(mill, topMills);
    const normalizedExporter = normalizeName(exporter, topExporters);
    const normalizedCountry = normalizeName(country, topCountries);

    // Buat node IDs dengan layer prefix
    const millId = `1:${normalizedMill}`;
    const exporterId = `2:${normalizedExporter}`;
    const countryId = `3:${normalizedCountry}`;

    // Tambah nodes jika belum ada
    [
      { id: millId, name: normalizedMill, kolom: 1 },
      { id: exporterId, name: normalizedExporter, kolom: 2 },
      { id: countryId, name: normalizedCountry, kolom: 3 },
    ].forEach(({ id, name, kolom }) => {
      if (!nodeIdSet.has(id)) {
        nodeIdSet.add(id);
        nodes.push({ id, name, kolom });
      }
    });

    // Tambah links
    linkSet.add(JSON.stringify({ source: millId, target: exporterId, value: volume }));
    linkSet.add(JSON.stringify({ source: exporterId, target: countryId, value: volume }));
  });

  // Konversi linkSet ke array dan agregasi volume
  const aggregatedLinks = {};
  linkSet.forEach((linkJson) => {
    const link = JSON.parse(linkJson);
    const key = `${link.source}→${link.target}`;
    aggregatedLinks[key] = (aggregatedLinks[key] || 0) + link.value;
  });

  const links = Object.entries(aggregatedLinks).map(([key, volume]) => {
    const [source, target] = key.split('→');
    return { source, target, value: volume };
  });

  return { nodes, links };
}

// ─── FUNGSI: HITUNG SUMMARY STATISTIK (pre-compute agar tidak dihitung di browser) ───
const EXCLUDED_MILL_IDS     = new Set(['1:UNKNOWN', '1:Lainnya','1:UNKNOWN AFFILIATION']);
const EXCLUDED_EXPORTER_IDS = new Set(['2:DOMESTIC PROCESSING AND CONSUMPTION', '2:UNKNOWN', '2:Lainnya', '2:UNKNOWN AFFILIATION']);
const EXCLUDED_DEST_IDS     = new Set(['3:UNKNOWN COUNTRY', '3:Lainnya']);

function buildSummary(nodes, links) {
  // Total volume: hanya exporter teridentifikasi
  const totalVolume = links
    .filter((link) => link.source.startsWith('2:') && !EXCLUDED_EXPORTER_IDS.has(link.source))
    .reduce((sum, link) => sum + link.value, 0);

  // Largest exporter teridentifikasi
  const exporterVolumes = {};
  links.forEach((link) => {
    if (link.source.startsWith('2:') && !EXCLUDED_EXPORTER_IDS.has(link.source)) {
      exporterVolumes[link.source] = (exporterVolumes[link.source] || 0) + link.value;
    }
  });
  const largestExporter = Object.entries(exporterVolumes).sort(([, a], [, b]) => b - a)[0]?.[0]?.split(':')[1] || 'N/A';

  // Top destination teridentifikasi
  const destinationVolumes = {};
  links.forEach((link) => {
    if (link.target.startsWith('3:') && !EXCLUDED_DEST_IDS.has(link.target)) {
      destinationVolumes[link.target] = (destinationVolumes[link.target] || 0) + link.value;
    }
  });
  const topDestination = Object.entries(destinationVolumes).sort(([, a], [, b]) => b - a)[0]?.[0]?.split(':')[1] || 'N/A';

  // Largest mill group teridentifikasi
  const millVolumes = {};
  links.forEach((link) => {
    if (link.source.startsWith('1:') && !EXCLUDED_MILL_IDS.has(link.source)) {
      millVolumes[link.source] = (millVolumes[link.source] || 0) + link.value;
    }
  });
  const largestMillGroup = Object.entries(millVolumes).sort(([, a], [, b]) => b - a)[0]?.[0]?.split(':')[1] || 'N/A';

  return {
    totalVolume: parseFloat((totalVolume / 1000).toFixed(1)), // juta ton
    largestExporter,
    topDestination,
    largestMillGroup,
  };
}

// ─── SIMPAN OUTPUT KE JSON FILE ───
const output = {
  meta: {
    commodity: 'PALM OIL',
    unit: 'ribu ton',
    districts: Object.keys(dataByDistrictYear).sort(),
    years: [2018, 2019, 2020, 2021, 2022],
  },
  data: {},
};

Object.entries(dataByDistrictYear).forEach(([district, byYear]) => {
  const availableYears = Object.keys(byYear).map(Number).sort();
  output.data[district] = { tahun_tersedia: availableYears };

  availableYears.forEach((year) => {
    const { nodes, links } = buildSankeyData(byYear[year].flows);
    const summary = buildSummary(nodes, links);
    output.data[district][year.toString()] = { nodes, links, summary };
  });
});

const outputPath = join(process.cwd(), 'src/data/supplychain-data.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`✅ Selesai! JSON tersimpan: ${outputPath}`);
console.log(`📊 Total: ${output.meta.districts.length} district × ${output.meta.years.length} tahun`);
console.log(`\nContoh struktur:`);
console.log(JSON.stringify(Object.entries(output.data)[0], null, 2));
