import { create } from "zustand";

// Simple layout state untuk toggle panels
const useLayoutStore = create((set) => ({
  leftOpen: true,
  rightOpen: true,
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
}));

// Header component - logo, title, action buttons
function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded flex items-center justify-center text-white font-bold">SEEG</div>
        <div>
          <h1 className="text-lg font-semibold">Plataforma — Clone</h1>
          <p className="text-xs text-gray-500">Interactive emissions dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-3 py-1 border rounded text-sm">Share</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Sign in</button>
      </div>
    </header>
  );
}

// Left panel - collapsible sidebar dengan filters
function LeftPanel() {
  const { leftOpen, toggleLeft } = useLayoutStore();
  return (
    <aside
      className={`transition-all duration-300 bg-white border-r ${
        leftOpen ? "w-64" : "w-12"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Toggle button untuk hide/show panel */}
        <button
          onClick={toggleLeft}
          className="self-end m-2 p-1 text-xs border rounded"
        >
          {leftOpen ? "←" : "→"}
        </button>
        {leftOpen && (
          <div className="p-4 space-y-4 text-sm">
            <div className="font-semibold">Filters</div>
            <div className="text-gray-600">Year Range</div>
            <div className="text-gray-600">Emission Type</div>
            <div className="text-gray-600">Gas</div>
          </div>
        )}
      </div>
    </aside>
  );
}

// Right panel - collapsible sidebar dengan highlights
function RightPanelLayout() {
  const { rightOpen, toggleRight } = useLayoutStore();
  return (
    <aside
      className={`transition-all duration-300 bg-white border-l ${
        rightOpen ? "w-64" : "w-12"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Toggle button untuk hide/show panel */}
        <button
          onClick={toggleRight}
          className="self-start m-2 p-1 text-xs border rounded"
        >
          {rightOpen ? "→" : "←"}
        </button>
        {rightOpen && (
          <div className="p-4 space-y-4 text-sm">
            <div className="font-semibold">Highlights</div>
            <div className="text-gray-600">Top Sector</div>
            <div className="text-gray-600">Worst Year</div>
          </div>
        )}
      </div>
    </aside>
  );
}

// Main content area - map/chart placeholder
function MainContent() {
  return (
    <main className="flex-1 bg-gray-50 p-6">
      <div className="h-96 bg-slate-100 border rounded flex items-center justify-center text-gray-400">
        Map / Chart Placeholder
      </div>
    </main>
  );
}

// Main layout - header + left panel + main content + right panel
export default function PlataformaLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <LeftPanel />
        <MainContent />
        <RightPanelLayout />
      </div>
    </div>
  );
}
