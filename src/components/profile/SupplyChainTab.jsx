import { useState, useMemo } from 'react';
import { SankeySupplyChain } from './SankeySupplyChain.jsx';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';
import SUPPLY_CHAIN_DATA from '../../data/supplychain-data.json';

// Pre-computed summary stats at build time — read directly from JSON without browser-side calculation
function getStatistics(district, year) {
  const summary = SUPPLY_CHAIN_DATA.data[district]?.[year]?.summary;
  if (!summary)
    return {
      totalVolume: '0',
      largestExporter: 'N/A',
      topDestination: 'N/A',
      largestMillGroup: 'N/A',
    };
  return { ...summary, totalVolume: summary.totalVolume.toFixed(1) };
}

// Commodity Supply Chain tab
export function SupplyChainTab({ kabupaten }) {
  const districtData = SUPPLY_CHAIN_DATA.data[kabupaten];
  const availableYears = districtData?.tahun_tersedia || [];
  const [selectedYear, setSelectedYear] = useState(
    availableYears[availableYears.length - 1] || 2022,
  );

  // Read pre-computed stats from JSON — no recalculation in browser
  const statistics = useMemo(
    () => getStatistics(kabupaten, selectedYear),
    [kabupaten, selectedYear],
  );

  const SUPPLY_CHAIN_STATS = [
    { label: 'Total Export Volume', value: `${statistics.totalVolume}`, unit: 'ribu ton CPO' },
    { label: 'Largest Mill Group', value: statistics.largestMillGroup, unit: 'main processor' },
    { label: 'Largest Exporter', value: statistics.largestExporter, unit: 'by volume' },
    { label: 'Top Destination', value: statistics.topDestination, unit: 'primary market' },
  ];
  return (
    <ProfileSection>
      <div className="flex items-center justify-between gap-4">
        <div>
          <SectionHeader
            title="Supply Chain"
            borderColor={COLORS.PRIMARY}
            dotColor={COLORS.PRIMARY}
          />
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
              <option key={year} value={year}>
                {year}
              </option>
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
