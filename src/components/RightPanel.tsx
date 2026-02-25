import CoverageChart from "./CoverageChart";
import Map from "./Map";

export function RightPanel() {

  return (
    <div className="flex-1 h-screen flex flex-col">
      {/* Top Right */}
      <div
        className='relative bg-[#99f6e4] h-[65%]  transition-all duration-300 ease-in-out overflow-hidden'>
          <div className="flex items-center justify-center h-full">
            <Map />
          </div>
      </div>

      {/* Bottom Right */}
      <div
        className='  h-[35%] transition-all duration-300 ease-in-out overflow-y-hidden'>
          <div className="flex pl-8 h-full">
            <div className="w-[650px] h-full">
              <CoverageChart />
            </div>

            <div className="w-[600px] h-full">
              <CoverageChart />
            </div>
            <div className="w-[600px] h-full">
              <CoverageChart />
            </div>
          </div>
      </div>
    </div>
  );
}
