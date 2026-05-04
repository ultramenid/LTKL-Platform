import { useState } from 'react';
import { PopulationTab } from './PopulationTab.jsx';
import { EconomyTab } from './EconomyTab.jsx';
import { CommodityTab } from './Commodity.jsx';
import { SupplyChainTab } from './SupplyChainTab.jsx';

const PRODUCT_SUB_TABS = [
  { id: 'population', label: 'Populasi' },
  { id: 'economy', label: 'Ekonomi' },
  { id: 'commodity', label: 'Komoditas' },
  { id: 'supplychain', label: 'Rantai Pasok' },
];

// Produk Unggulan tab — wraps existing analytics sub-tabs with internal navigation
export function ProdukUnggulanTab({ kabupaten }) {
  const [activeSubTab, setActiveSubTab] = useState('population');

  return (
    <div>
      {/* Sub-tab navigation — sticky below the main dark nav bar */}
      <div className="border-b border-gray-200 bg-white sticky top-[49px] z-20">
        <div className="max-w-5xl mx-auto flex overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {PRODUCT_SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 min-w-max px-5 py-2.5 text-sm font-semibold transition border-b-2 whitespace-nowrap text-center cursor-pointer ${
                activeSubTab === tab.id
                  ? 'text-teal-600 border-teal-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'population' && <PopulationTab />}
      {activeSubTab === 'economy' && <EconomyTab />}
      {activeSubTab === 'commodity' && <CommodityTab />}
      {activeSubTab === 'supplychain' && <SupplyChainTab kabupaten={kabupaten.toUpperCase()} />}
    </div>
  );
}
