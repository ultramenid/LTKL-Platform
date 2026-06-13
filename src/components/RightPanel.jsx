import CoverageChart from './map/CoverageChart.jsx';
import StackCoverageChart from './map/StackCoverageChart.jsx';
import SankeyTransitionChart from './map/SankeyTransitionChart.jsx';
import ChartYearRangeSelector from './map/ChartYearRangeSelector.jsx';
import Map from './map/Map.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../store/mapStore.js';

export function RightPanel({ onToggleSidebar }) {
  const { kab, kec, des } = useMapStore(
    useShallow((state) => ({
      kab: state.breadcrumbs.kab ?? null,
      kec: state.breadcrumbs.kec ?? null,
      des: state.breadcrumbs.des ?? null,
    })),
  );

  return (
    <div className="flex-1 h-screen flex flex-col bg-parchment-50 border-coffee-900/15">
      <div className="relative h-[65%] transition-all duration-300 ease-in-out overflow-hidden">
        <ErrorBoundary label="Peta">
          <Map onToggleSidebar={onToggleSidebar} />
        </ErrorBoundary>
      </div>

      <div className="h-[35%] transition-all duration-300 ease-in-out flex flex-col border-t border-coffee-900/10 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-3 border-b border-coffee-900/10 bg-parchment-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.16em] text-coffee-400 font-medium">
              Rentang Tahun
            </span>
            <ChartYearRangeSelector />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(20,184,166,0.45)]" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-coffee-900 truncate">
              Analitik Tutupan Lahan
            </h2>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-hidden overflow-x-auto">
          <div className="flex h-full min-w-full">
            <div className="flex-1 min-w-[320px] h-full border-r border-coffee-900/15 bg-white overflow-hidden">
              <ErrorBoundary label="Transisi Tutupan Lahan">
                <SankeyTransitionChart kabupaten={kab} kec={kec} des={des} />
              </ErrorBoundary>
            </div>

            <div className="flex-1 min-w-[320px] h-full border-r border-coffee-900/15 bg-white overflow-hidden">
              <ErrorBoundary label="Komposisi Tutupan Lahan">
                <StackCoverageChart kabupaten={kab} kec={kec} des={des} />
              </ErrorBoundary>
            </div>

            <div className="flex-1 min-w-[320px] h-full bg-white overflow-hidden">
              <ErrorBoundary label="Grafik Tutupan Lahan">
                <CoverageChart />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
