import CoverageChart from "./CoverageChart.jsx";
import Map from "./Map.jsx";

// Right panel - Main content area
// Layout: Map (top 65%) + Charts (bottom 35%)
// Fungsi: tampilkan map interaktif dan data visualization
export function RightPanel() {
  return (
    <div className="flex-1 h-screen flex flex-col">
      {/* MAP SECTION (65% height) */}
      <div className='relative bg-gray-100 h-[65%] transition-all duration-300 ease-in-out overflow-hidden'>
        <Map />
      </div>

      {/* CHART SECTION (35% height) */}
      {/* Horizontal scrollable area dengan multiple coverage charts */}
      <div className='h-[35%] transition-all duration-300 ease-in-out flex flex-col border-t border-gray-100 bg-white'>
        {/* Section header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Land Use / Land Cover Analytics</p>
          </div>
          <p className="text-[10px] text-gray-400">Chart</p>
        </div>

        {/* Charts scroll area */}
        <div className="flex-1 min-h-0 overflow-y-hidden overflow-x-auto">
          <div className="flex h-full min-w-full">
            {/* Chart 1 */}
            <div className="flex-1 min-w-[320px] h-full border-r border-gray-100">
              <CoverageChart />
            </div>
            {/* Chart 2 */}
            <div className="flex-1 min-w-[320px] h-full border-r border-gray-100">
              <CoverageChart />
            </div>
            {/* Chart 3 */}
            <div className="flex-1 min-w-[320px] h-full">
              <CoverageChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
