import { COLORS } from '../../config/constants.js';

export function SankeyHeader({ yearFromProp, availableYears, selectedYear, onYearChange }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-end gap-3 rounded-t-xl">
      {!yearFromProp && availableYears.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium">Tahun</span>
          <div className="relative">
            <select
              value={selectedYear ?? ''}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="appearance-none pl-3 pr-7 py-1.5 text-[12px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-gray-400 transition focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': COLORS.PRIMARY }}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <svg
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
            >
              <path
                d="M1 1l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {!yearFromProp && <div className="w-px h-5 bg-gray-200" />}

      <button
        type="button"
        className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md hover:border-gray-400 transition cursor-pointer"
      >
        Unduh Pilihan
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-400">
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
