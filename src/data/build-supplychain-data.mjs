import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ─── READ CSV (read supply chain data source file) ───
const csvPath = join(process.cwd(), 'src/data/palmoil.csv');
const csvContent = readFileSync(csvPath, 'utf-8');
const csvLines = csvContent.trim().split('\n');

// Header and data rows
const csvHeader = csvLines[0].split(';');
const csvData = csvLines.slice(1);

// Column mapping (map CSV columns to indices)
const colIndexYear = csvHeader.indexOf('Year');
const colIndexDistrict = csvHeader.indexOf('Kabupaten of production');
const colIndexMillGroup = csvHeader.indexOf('Mill group');
const colIndexExporterGroup = csvHeader.indexOf('Exporter group');
const colIndexCountryFirstImport = csvHeader.indexOf('Country of first import');
const colIndexTradeVolume = csvHeader.indexOf('Trade volume');

console.log(`📖 Reading CSV: ${csvData.length} data rows`);
console.log(
  `Columns: Year(${colIndexYear}), District(${colIndexDistrict}), Mill(${colIndexMillGroup}), Exporter(${colIndexExporterGroup}), Country(${colIndexCountryFirstImport}), Volume(${colIndexTradeVolume})`,
);

// ─── AGGREGATE DATA BY DISTRICT + YEAR ───
const dataByDistrictYear = {};

csvData.forEach((row, idx) => {
  const columns = row.split(';');
  const year = columns[colIndexYear]?.trim();
  const district = columns[colIndexDistrict]?.trim();
  const millGroup = columns[colIndexMillGroup]?.trim() || 'UNKNOWN';
  const exporterGroup = columns[colIndexExporterGroup]?.trim() || 'UNKNOWN';
  const countryFirstImport = columns[colIndexCountryFirstImport]?.trim() || 'UNKNOWN';
  const tradeVolume = parseFloat(columns[colIndexTradeVolume]?.trim()) || 0;

  // Skip if data is incomplete
  if (!year || !district) return;

  // Initialize structure
  if (!dataByDistrictYear[district]) dataByDistrictYear[district] = {};
  if (!dataByDistrictYear[district][year]) {
    dataByDistrictYear[district][year] = {
      flows: [], // Each flow is (mill, exporter, country, volume)
    };
  }

  dataByDistrictYear[district][year].flows.push({
    mill: millGroup,
    exporter: exporterGroup,
    country: countryFirstImport,
    volume: tradeVolume,
  });

  if ((idx + 1) % 10000 === 0) console.log(`  ✓ ${idx + 1}/${csvData.length} rows processed`);
});

console.log(`✓ Aggregation complete for ${Object.keys(dataByDistrictYear).length} districts\n`);

// ─── FUNCTION: BUILD NODES + LINKS FROM FLOW ───
const MAX_NODES_PER_LAYER = 6;

function buildSankeyData(flowList) {
  // Aggregate flow: (mill → exporter → country) with volume
  const aggregatedFlows = {};
  flowList.forEach(({ mill, exporter, country, volume }) => {
    const flowKey = `${mill}||${exporter}||${country}`;
    aggregatedFlows[flowKey] = (aggregatedFlows[flowKey] || 0) + volume;
  });

  // Calculate volume per tier (layer)
  const volumeTierDistrictMill = {}; // mill → total volume
  const volumeTierMillExporter = {}; // exporter → total volume
  const volumeTierExporterCountry = {}; // country → total volume

  Object.entries(aggregatedFlows).forEach(([flowKey, volume]) => {
    const [mill, exporter, country] = flowKey.split('||');
    volumeTierDistrictMill[mill] = (volumeTierDistrictMill[mill] || 0) + volume;
    volumeTierMillExporter[exporter] = (volumeTierMillExporter[exporter] || 0) + volume;
    volumeTierExporterCountry[country] = (volumeTierExporterCountry[country] || 0) + volume;
  });

  // Top-N per layer, rest → "Lainnya"
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

  // Helper: normalize name to top-N or "Lainnya"
  const normalizeName = (name, topList) => {
    return topList.includes(name) ? name : 'Lainnya';
  };

  // Build nodes + links
  const nodes = [];
  const linkSet = new Set();
  const nodeIdSet = new Set();

  // Layer 0: District (placeholder, not in CSV, so we set to district name later)
  // Layer 1: Mill groups
  // Layer 2: Exporters
  // Layer 3: Countries

  // Process each aggregated flow
  Object.entries(aggregatedFlows).forEach(([flowKey, volume]) => {
    const [mill, exporter, country] = flowKey.split('||');
    const normalizedMill = normalizeName(mill, topMills);
    const normalizedExporter = normalizeName(exporter, topExporters);
    const normalizedCountry = normalizeName(country, topCountries);

    // Build node IDs with layer prefix
    const millId = `1:${normalizedMill}`;
    const exporterId = `2:${normalizedExporter}`;
    const countryId = `3:${normalizedCountry}`;

    // Add nodes if not yet present
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

    // Add links
    linkSet.add(JSON.stringify({ source: millId, target: exporterId, value: volume }));
    linkSet.add(JSON.stringify({ source: exporterId, target: countryId, value: volume }));
  });

  // Convert linkSet to array and aggregate volume
  const aggregatedLinks = {};
  linkSet.forEach((linkJson) => {
    const link = JSON.parse(linkJson);
    const linkKey = `${link.source}→${link.target}`;
    aggregatedLinks[linkKey] = (aggregatedLinks[linkKey] || 0) + link.value;
  });

  const links = Object.entries(aggregatedLinks).map(([linkKey, volume]) => {
    const [source, target] = linkKey.split('→');
    return { source, target, value: volume };
  });

  return { nodes, links };
}

// ─── FUNCTION: COMPUTE SUMMARY STATISTICS (pre-compute to avoid browser-side calculation) ───
const EXCLUDED_MILL_IDS = new Set(['1:UNKNOWN', '1:Lainnya', '1:UNKNOWN AFFILIATION']);
const EXCLUDED_EXPORTER_IDS = new Set([
  '2:DOMESTIC PROCESSING AND CONSUMPTION',
  '2:UNKNOWN',
  '2:Lainnya',
  '2:UNKNOWN AFFILIATION',
]);
const EXCLUDED_DEST_IDS = new Set(['3:UNKNOWN COUNTRY', '3:Lainnya']);

function buildSummary(nodes, links) {
  // Total volume: only identified exporters
  const totalVolume = links
    .filter((link) => link.source.startsWith('2:') && !EXCLUDED_EXPORTER_IDS.has(link.source))
    .reduce((sum, link) => sum + link.value, 0);

  // Largest identified exporter
  const exporterVolumes = {};
  links.forEach((link) => {
    if (link.source.startsWith('2:') && !EXCLUDED_EXPORTER_IDS.has(link.source)) {
      exporterVolumes[link.source] = (exporterVolumes[link.source] || 0) + link.value;
    }
  });
  const largestExporter =
    Object.entries(exporterVolumes)
      .sort(([, a], [, b]) => b - a)[0]?.[0]
      ?.split(':')[1] || 'N/A';

  // Top identified destination
  const destinationVolumes = {};
  links.forEach((link) => {
    if (link.target.startsWith('3:') && !EXCLUDED_DEST_IDS.has(link.target)) {
      destinationVolumes[link.target] = (destinationVolumes[link.target] || 0) + link.value;
    }
  });
  const topDestination =
    Object.entries(destinationVolumes)
      .sort(([, a], [, b]) => b - a)[0]?.[0]
      ?.split(':')[1] || 'N/A';

  // Largest identified mill group
  const millVolumes = {};
  links.forEach((link) => {
    if (link.source.startsWith('1:') && !EXCLUDED_MILL_IDS.has(link.source)) {
      millVolumes[link.source] = (millVolumes[link.source] || 0) + link.value;
    }
  });
  const largestMillGroup =
    Object.entries(millVolumes)
      .sort(([, a], [, b]) => b - a)[0]?.[0]
      ?.split(':')[1] || 'N/A';

  return {
    totalVolume: parseFloat((totalVolume / 1000).toFixed(1)), // million tonnes
    largestExporter,
    topDestination,
    largestMillGroup,
  };
}

// ─── SAVE OUTPUT TO JSON FILE ───
const output = {
  meta: {
    commodity: 'PALM OIL',
    unit: 'thousand tonnes',
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

console.log(`✅ Done! JSON saved: ${outputPath}`);
console.log(
  `📊 Total: ${output.meta.districts.length} districts × ${output.meta.years.length} years`,
);
console.log(`\nSample structure:`);
console.log(JSON.stringify(Object.entries(output.data)[0], null, 2));
