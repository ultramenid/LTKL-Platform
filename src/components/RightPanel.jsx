import CoverageChart from "./CoverageChart.jsx";
import Map from "./Map.jsx";

// Right panel - Main content area
// Layout: Map (top 65%) + Charts (bottom 35%)
// Fungsi: tampilkan map interaktif dan data visualization
export function RightPanel() {
  return (
    <div className="flex-1 h-screen flex flex-col">
      {/* MAP SECTION (65% height) */}
      {/* Contains interactive MapLibre GL map dengan breadcrumbs, time selector overlay */}
      <div className='relative bg-[#99f6e4] h-[65%] transition-all duration-300 ease-in-out overflow-hidden'>
        <div className="flex items-center justify-center h-full">
          <Map />
        </div>
      </div>

      {/* CHART SECTION (35% height) */}
      {/* Horizontal scrollable area dengan multiple coverage charts */}
      <div className='h-[35%] transition-all duration-300 ease-in-out overflow-y-hidden'>
        <div className="flex pl-8 h-full">
          {/* Chart 1 - Coverage chart */}
          <div className="w-[650px] h-full">
            <CoverageChart />
          </div>

          {/* Chart 2 - Additional coverage data */}
          <div className="w-[600px] h-full">
            <CoverageChart />
          </div>
          
          {/* Chart 3 - More coverage visualization */}
          <div className="w-[600px] h-full">
            <CoverageChart />
          </div>
        </div>
      </div>
    </div>
  );
}
