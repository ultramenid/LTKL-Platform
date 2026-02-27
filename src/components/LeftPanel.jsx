import { KabupatenCard } from "./KabupatesList.jsx";

// Left sidebar panel - Logo + Kabupaten list
// Fungsi: tempat user memilih kabupaten
// Contains: LTKL logo + list kabupaten untuk drill-down
export function LeftPanel() {
  return (
    <div className="w-full h-screen relative overflow-y-auto shadow-lg border-r border-gray-100">
      {/* Logo header - sticky di top saat scroll */}
      <div className="flex w-full items-center justify-center sticky top-0 bg-white">
        <img src="/logo/ltkl.png" alt="LTKL Platform" className="h-24 px-4 py-4" />
      </div>
      
      {/* Kabupaten list component - user bisa klik untuk drill */}
      <KabupatenCard />
    </div>
  );
}

export default LeftPanel;
