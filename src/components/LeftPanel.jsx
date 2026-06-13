import { useState } from 'react';
import { Search, Layers, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { KabupatenCard } from './map/KabupatensList.jsx';
import { KABUPATENS } from '../data/kabupatens.js';

export function LeftPanel({ onClose, collapsed = false, onToggleCollapse }) {
  const [searchText, setSearchText] = useState('');

  // ─── COLLAPSED RAIL (desktop only) ───
  // key forces a remount on mode switch so sidebar-content-in replays;
  // without it React reuses the root div and the fade never triggers
  if (collapsed) {
    return (
      <div
        key="collapsed-rail"
        className="w-full h-full flex flex-col bg-parchment-50 border-r border-coffee-900/10 sidebar-content-in"
      >
        <div className="shrink-0 flex flex-col items-center gap-2.5 py-4 border-b border-coffee-900/10">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers size={16} className="text-primary" />
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg hover:bg-parchment-200 flex items-center justify-center text-coffee-400 hover:text-coffee-600 transition-colors cursor-pointer"
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
  // min-w keeps the content at its final width while the wrapper's width
  // animates (wrapper has overflow-hidden), so text reveals instead of squishing
  return (
    <div
      key="expanded-panel"
      className="w-full min-w-[280px] h-full flex flex-col bg-parchment-50 border-r border-coffee-900/10 sidebar-content-in"
    >
      <div className="shrink-0 px-5 py-4 border-b border-coffee-900/10 bg-parchment-50">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden shrink-0" style={{ height: '36px' }}>
            <img
              src="/logo/ltkl.png"
              alt="LTKL"
              style={{ height: '58px', width: 'auto', objectPosition: 'top left' }}
            />
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-coffee-900 leading-tight tracking-tight">
              Lingkar Temu
            </p>
            <p className="text-[11px] font-semibold text-coffee-900 leading-tight tracking-tight">
              Kabupaten Lestari
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-parchment-200 items-center justify-center shrink-0 text-coffee-400 hover:text-coffee-600 transition-colors cursor-pointer"
            aria-label="Tutup sidebar"
            title="Tutup sidebar"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg bg-parchment-200 hover:bg-parchment-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer ml-auto"
            aria-label="Tutup sidebar"
          >
            <X size={14} className="text-coffee-500" />
          </button>
        </div>

        <div className="mt-4 relative">
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Cari kabupaten..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs bg-parchment-50 border border-coffee-900/10 rounded-lg outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-coffee-900 placeholder:text-coffee-400"
            aria-label="Cari kabupaten"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 transition-colors"
              aria-label="Hapus pencarian"
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold text-coffee-600 uppercase tracking-[0.2em]">
          Kabupaten Anggota
        </p>
        <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 tabular-nums">
          {KABUPATENS.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <KabupatenCard filterText={searchText} />
      </div>

      <div className="shrink-0 border-t border-coffee-900/10 px-5 py-3">
        <p className="text-[10px] text-coffee-400 text-center leading-relaxed">
          © 2026 LTKL · Auriga Nusantara
        </p>
      </div>
    </div>
  );
}
