import { KabupatenCard } from "./KabupatesList.jsx";

export function LeftPanel() {
  return (
    <div className="w-full h-screen  relative overflow-y-auto shadow-lg border-r border-gray-100">
      {/* Logo */}
      <div className="flex w-full items-center justify-center sticky top-0 bg-white">
        <img src="/logo/ltkl.png" alt="LTKL Platform" className=" h-24 px-4 py-4" />
      </div>
      {/* Daftar kabupaten */}
      <KabupatenCard />
    </div>
  );
}

export default LeftPanel;
