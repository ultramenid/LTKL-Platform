import { ChevronDown, Download } from 'lucide-react';
import { COLORS } from '../../config/constants.js';

const PRODUK_ACCENT = COLORS.PRIMARY;

export function SankeyHeader({ yearFromProp, availableYears, selectedYear, onYearChange }) {
  return (
    <div className="border-b border-coffee-900/15 px-4 py-2.5 flex items-center justify-between gap-3">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.24em]"
        style={{ color: PRODUK_ACCENT }}
      >
        Aliran Rantai Pasok CPO
      </p>

      <div className="flex items-center gap-3">
        {!yearFromProp && availableYears.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-coffee-600 font-semibold uppercase tracking-[0.12em]">
              Tahun
            </span>
            <div className="relative">
              <select
                value={selectedYear ?? ''}
                onChange={(event) => onYearChange(Number(event.target.value))}
                className="appearance-none pl-3 pr-7 py-1.5 text-[12px] font-bold tabular-nums text-coffee-900 bg-white border border-coffee-900/30 cursor-pointer hover:border-coffee-900 transition-colors focus:outline-none focus:ring-2 focus:ring-coffee-900/20"
                aria-label="Pilih tahun aliran rantai pasok"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                aria-hidden="true"
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-coffee-600"
              />
            </div>
          </div>
        )}

        {!yearFromProp && <div className="w-px h-5 bg-coffee-900/15" />}

        <button
          type="button"
          className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-coffee-900 underline underline-offset-4 decoration-coffee-900/30 hover:decoration-coffee-900 transition-colors"
        >
          <Download size={11} aria-hidden="true" />
          Unduh Pilihan
        </button>
      </div>
    </div>
  );
}
