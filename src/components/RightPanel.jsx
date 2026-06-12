import CoverageChart from './map/CoverageChart.jsx';
import StackCoverageChart from './map/StackCoverageChart.jsx';
import SankeyTransitionChart from './map/SankeyTransitionChart.jsx';
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
    <div className="flex-1 h-screen flex flex-col">
      <div className="relative bg-gray-100 h-[65%] transition-all duration-300 ease-in-out overflow-hidden">
        <ErrorBoundary label="Peta">
          <Map onToggleSidebar={onToggleSidebar} />
        </ErrorBoundary>
      </div>

      <div className="h-[35%] transition-all duration-300 ease-in-out flex flex-col border-t border-stone-200/80 bg-white">
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-stone-200/80">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-700">
              Analitik Tutupan Lahan
            </h2>
          </div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Grafik</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-hidden overflow-x-auto">
          <div className="flex h-full min-w-full">
            <div className="flex-1 min-w-[320px] h-full border-r border-gray-100">
              <ErrorBoundary label="Transisi Tutupan Lahan">
                <SankeyTransitionChart kabupaten={kab} kec={kec} des={des} />
              </ErrorBoundary>
            </div>

            <div className="flex-1 min-w-[320px] h-full border-r border-gray-100">
              <ErrorBoundary label="Komposisi Tutupan Lahan">
                <StackCoverageChart kabupaten={kab} kec={kec} des={des} />
              </ErrorBoundary>
            </div>

            <div className="flex-1 min-w-[320px] h-full">
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
