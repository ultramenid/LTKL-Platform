import { PopulationTab } from './PopulationTab.jsx';
import { EconomyTab } from './EconomyTab.jsx';
import { CommodityTab } from './Commodity.jsx';
import { SupplyChainTab } from './SupplyChainTab.jsx';

export function ProdukUnggulanTab({ kabupaten, activeSubTab }) {
  if (activeSubTab === 'economy') return <EconomyTab />;
  if (activeSubTab === 'commodity') return <CommodityTab />;
  if (activeSubTab === 'supplychain') return <SupplyChainTab kabupaten={kabupaten.toUpperCase()} />;
  return <PopulationTab />;
}
