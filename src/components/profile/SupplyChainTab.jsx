import { useState, useMemo } from 'react';
import { SankeySupplyChain } from './SankeySupplyChain.jsx';
import { COLORS } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { SubSectionHeader } from './SubSectionHeader.jsx';
import SUPPLY_CHAIN_DATA from '../../data/supplychain-data.json';

const PRODUK_ACCENT = COLORS.PRIMARY;

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

export function SupplyChainTab({ kabupaten }) {
  const districtData = SUPPLY_CHAIN_DATA.data[kabupaten];
  const availableYears = districtData?.tahun_tersedia || [];
  const [selectedYear, setSelectedYear] = useState(
    availableYears[availableYears.length - 1] || 2022,
  );

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
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <SectionHeader
              kicker="Produk Unggulan · Rantai Pasok"
              title="Supply Chain"
              accent={PRODUK_ACCENT}
            />
          </div>

          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="shrink-0 px-3 py-1.5 text-sm font-bold tabular-nums text-coffee-900 bg-white border border-coffee-900/30 cursor-pointer hover:border-coffee-900 transition-colors focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': COLORS.PRIMARY }}
              aria-label="Pilih tahun data rantai pasok"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-coffee-900/80 divide-x divide-coffee-900/15">
          {SUPPLY_CHAIN_STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-4">
              <p className="text-[9px] text-coffee-600 uppercase tracking-[0.15em] font-semibold">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-coffee-900 tabular-nums mt-1">{stat.value}</p>
              <p className="text-[10px] text-coffee-600 mt-0.5">{stat.unit}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SubSectionHeader title="Supply Chain Flow" accent={PRODUK_ACCENT} />
        <SankeySupplyChain kabupaten={kabupaten} year={selectedYear} />
      </div>
    </ProfileSection>
  );
}
