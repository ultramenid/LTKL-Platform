import { useState, useMemo } from 'react';
import { SankeySupplyChain } from './SankeySupplyChain.jsx';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';
import SUPPLY_CHAIN_DATA from '../../data/supplychain-data.json';

// ─── HELPER: HITUNG STATISTIK DARI SUPPLYCHAIN DATA ───
function calculateStatistics(district, year) {
  const districtData = SUPPLY_CHAIN_DATA.data[district];
  if (!districtData || !districtData[year]) {
    return {
      totalVolume: '0',
      largestExporter: 'N/A',
      topDestination: 'N/A',
      largestMillGroup: 'N/A',
    };
  }

  const yearData = districtData[year];
  const { nodes, links } = yearData;

  // Total volume dari sum semua links
  const totalVolume = links.reduce((sum, link) => sum + link.value, 0);

  // Largest Exporter (layer 2): node dengan volume total terbesar
  const exporters = nodes.filter((n) => n.kolom === 2);
  const exporterVolumes = {};
  links.forEach((link) => {
    if (link.source.startsWith('2:')) {
      exporterVolumes[link.source] = (exporterVolumes[link.source] || 0) + link.value;
    }
  });
  const largestExporter = Object.entries(exporterVolumes).sort(([, a], [, b]) => b - a)[0]?.[0]?.split(':')[1] || 'N/A';

  // Top Destination (layer 3): node dengan volume total terbesar
  const destinationVolumes = {};
  links.forEach((link) => {
    if (link.target.startsWith('3:')) {
      destinationVolumes[link.target] = (destinationVolumes[link.target] || 0) + link.value;
    }
  });
  const topDestination = Object.entries(destinationVolumes).sort(([, a], [, b]) => b - a)[0]?.[0]?.split(':')[1] || 'N/A';

  // Largest Mill Group (layer 1): node dengan volume total terbesar
  const millVolumes = {};
  links.forEach((link) => {
    if (link.source.startsWith('1:')) {
      millVolumes[link.source] = (millVolumes[link.source] || 0) + link.value;
    }
  });
  const largestMillName = Object.entries(millVolumes).sort(([, a], [, b]) => b - a)[0]?.[0]?.split(':')[1] || 'N/A';

  return {
    totalVolume: (totalVolume / 1000).toFixed(1), // Convert ke juta ton dari ribu ton
    largestExporter,
    topDestination,
    largestMillGroup: largestMillName,
  };
}

// Tab Rantai Pasok Komoditas
export function SupplyChainTab({ kabupaten = 'SIAK' }) {
  const districtData = SUPPLY_CHAIN_DATA.data[kabupaten];
  const availableYears = districtData?.tahun_tersedia || [];
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || 2022);

  // Hitung statistik berdasarkan kabupaten dan tahun yang dipilih
  const statistics = useMemo(() => {
    return calculateStatistics(kabupaten, selectedYear);
  }, [kabupaten, selectedYear]);

  const SUPPLY_CHAIN_STATS = [
    { label: 'Total Export Volume', value: `${statistics.totalVolume}`, unit: 'juta ton CPO' },
    { label: 'Largest Exporter',    value: statistics.largestExporter,  unit: 'by volume' },
    { label: 'Top Destination',     value: statistics.topDestination,   unit: 'primary market' },
    { label: 'Largest Mill Group',  value: statistics.largestMillGroup, unit: 'main processor' },
  ];
  return (
    <ProfileSection>
      <div className="flex items-center justify-between gap-4">
        <div>
          <SectionHeader title="Supply Chain" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />
        </div>
        {/* ─── YEAR SELECTOR DROPDOWN ───*/}
        {availableYears.length > 0 && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded cursor-pointer hover:border-gray-400 transition focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': COLORS.PRIMARY }}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
      </div>

      {/* ─── SUMMARY STATISTICS CARDS (volume, exporters, destinations) ───*/}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SUPPLY_CHAIN_STATS.map((stat) => (
          <div key={stat.label} className="bg-teal-50 border border-teal-100 p-4 rounded-lg">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-teal-700 mt-1">{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* ─── SANKEY VISUALIZATION (alur rantai pasok dengan nodes & links) ───*/}
      <div>
        <SubSectionHeader title="Supply Chain Flow" dotColor={COLORS.PRIMARY} />
        <SankeySupplyChain kabupaten={kabupaten} tahunDipilih={selectedYear} />
      </div>

     
    </ProfileSection>
  );
}
