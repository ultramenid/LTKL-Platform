import CoverageChart from './map/CoverageChart.jsx';
import Map from './map/Map.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

export function RightPanel({ onToggleSidebar }) {
  return (
    <div className="flex-1 h-screen flex flex-col">
      <div className="relative bg-gray-100 h-[65%] transition-all duration-300 ease-in-out overflow-hidden">
        <ErrorBoundary label="Peta">
          <Map onToggleSidebar={onToggleSidebar} />
        </ErrorBoundary>
      </div>

      <div className="h-[35%] transition-all duration-300 ease-in-out flex flex-col border-t border-gray-100 bg-white">
        <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              Analitik Tutupan Lahan
            </p>
          </div>
          <p className="text-[10px] text-gray-400">Grafik</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-hidden overflow-x-auto">
          <div className="flex h-full min-w-full">
            <div className="flex-1 min-w-[320px] h-full border-r border-gray-100">
              <ErrorBoundary label="Grafik Tutupan Lahan">
                <CoverageChart />
              </ErrorBoundary>
            </div>
            <div className="flex-1 min-w-[320px] h-full border-r border-gray-100 flex items-center justify-center">
              <ErrorBoundary label="Grafik Analitik">
                <CoverageChart />
              </ErrorBoundary>
            </div>
            <div className="flex-1 min-w-[320px] h-full flex items-center justify-center">
              <ErrorBoundary label="Grafik Analitik">
                <CoverageChart />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
