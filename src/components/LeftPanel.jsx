import { useState } from 'react';
import { Search, Layers, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { KabupatenCard } from './map/KabupatensList.jsx';
import { KABUPATENS } from '../data/kabupatens.js';

export function LeftPanel({ onClose, collapsed = false, onToggleCollapse }) {
  const [searchText, setSearchText] = useState('');

  // ─── COLLAPSED RAIL (desktop only) ───
  if (collapsed) {
    return (
      <div className="w-full h-full flex flex-col bg-white border-r border-gray-100">
        <div className="shrink-0 flex flex-col items-center gap-2.5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
            <Layers size={16} className="text-teal-500" />
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Buka sidebar"
            title="Buka sidebar"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-3">
          <KabupatenCard collapsed />
        </div>
      </div>
    );
  }

  // ─── EXPANDED PANEL ───
  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-100">
      <div className="shrink-0 px-5 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden shrink-0" style={{ height: '36px' }}>
            <img
              src="/logo/ltkl.png"
              alt="LTKL"
              style={{ height: '58px', width: 'auto', objectPosition: 'top left' }}
            />
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-800 leading-tight tracking-tight">
              Lingkar Temu
            </p>
            <p className="text-[11px] font-semibold text-gray-800 leading-tight tracking-tight">
              Kabupaten Lestari
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Tutup sidebar"
            title="Tutup sidebar"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer ml-auto"
            aria-label="Tutup sidebar"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        <div className="mt-4 relative">
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Cari kabupaten..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all text-gray-700 placeholder:text-gray-400"
            aria-label="Cari kabupaten"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Hapus pencarian"
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
          Kabupaten Anggota
        </p>
        <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5 tabular-nums">
          {KABUPATENS.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <KabupatenCard filterText={searchText} />
      </div>

      <div className="shrink-0 border-t border-gray-100 px-5 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          © 2026 LTKL · Auriga Nusantara
        </p>
      </div>
    </div>
  );
}
