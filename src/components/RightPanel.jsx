import CoverageChart from './map/CoverageChart.jsx';
import Map from './map/Map.jsx';

// Main panel — map (65%) + chart (35%)
export function RightPanel({ onToggleSidebar }) {
  return (
    <div className="flex-1 h-screen flex flex-col">
      {/* Map area (65% height) */}
      <div className="relative bg-gray-100 h-[65%] transition-all duration-300 ease-in-out overflow-hidden">
        <Map onToggleSidebar={onToggleSidebar} />
      </div>

      {/* Chart area (35%) — horizontally scrollable */}
      <div className="h-[35%] transition-all duration-300 ease-in-out flex flex-col border-t border-gray-100 bg-white">
        {/* Concise title so analytics context stays visible while scrolling */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              Analitik Tutupan Lahan
            </p>
          </div>
          <p className="text-[10px] text-gray-400">Grafik</p>
        </div>

        {/* Scrollable area for multiple side-by-side charts */}
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
