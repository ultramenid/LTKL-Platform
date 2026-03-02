import { useState } from "react";
import { Search, Layers, X } from "lucide-react";
import { KabupatenCard } from "./map/KabupatesList.jsx";

// Left sidebar panel - Logo + search + Kabupaten list
// Fungsi: tempat user memilih kabupaten untuk drill-down ke peta
// Di mobile menjadi overlay drawer — onClose menutup drawer saat user selesai
export function LeftPanel({ onClose }) {
  const [searchText, setSearchText] = useState("");

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-100">
      {/* ── Header: Logo + Platform identity ── */}
      <div className="shrink-0 px-5 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          {/* Logo — crop bottom text via overflow-hidden */}
          <div className="overflow-hidden shrink-0" style={{ height: "36px" }}>
            <img
              src="/logo/ltkl.png"
              alt="LTKL"
              style={{ height: "58px", width: "auto", objectPosition: "top left" }}
            />
          </div>
          {/* Tombol tutup drawer — hanya muncul di mobile, langsung setelah logo */}
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Tutup sidebar"
          >
            <X size={14} className="text-gray-500" />
          </button>
          {/* Teks platform — disembunyikan di mobile karena ruang terbatas */}
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-[11px] font-bold text-gray-800 leading-tight tracking-tight">Lingkar Temu</p>
            <p className="text-[11px] font-bold text-gray-800 leading-tight tracking-tight">Kabupaten Lestari</p>
          </div>
          {/* Icon dekoratif — hanya muncul di desktop */}
          <div className="hidden lg:flex w-7 h-7 rounded-lg bg-teal-50 items-center justify-center shrink-0">
            <Layers size={14} className="text-teal-500" />
          </div>
        </div>

        {/* Search input */}
        <div className="mt-4 relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kabupaten..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all text-gray-700 placeholder:text-gray-400"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Section label ── */}
      <div className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kabupaten Anggota</p>
      </div>

      {/* ── Kabupaten list (scrollable) ── */}
      <div className="flex-1 overflow-y-auto">
        <KabupatenCard filterText={searchText} />
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-gray-100 px-5 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          © 2025 LTKL · Auriga Nusantara
        </p>
      </div>
    </div>
  );
}

export default LeftPanel;
