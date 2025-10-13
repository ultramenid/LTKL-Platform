import { useState } from "react";

interface TimeSeriesSelectorProps {
  startYear?: number;
  endYear?: number;
  onChange?: (year: number) => void;
}

export default function TimeSeriesSelector({
  startYear = 2000,
  endYear = 2024,
  onChange,
}: TimeSeriesSelectorProps) {
  const [year, setYear] = useState(endYear);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleChange = (newYear: number) => {
    setYear(newYear);
    onChange?.(newYear);
  };

  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div className="absolute bottom-4 left-4 select-none bg-white px-1 py-1">
      {/* Year labels */}
      <div className="flex items-center justify-between text-[10px] text-gray-600">
        <span className="text-[#115e59]">{startYear}</span>
        <span className="text-[#115e59] font-black">{year}</span>
      </div>

      {/* Timeline */}
      <div className="relative flex items-center justify-center gap-1.5 h-6">
        {/* Base line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-gray-300 -translate-y-1/2 pointer-events-none"></div>

        {/* Dots with hover-only tooltip */}
        {years.map((y) => (
          <div key={y} className="relative flex items-center justify-center">
            {/* Tooltip only on hover */}
            {hovered === y && (
              <div className="absolute -top-5 px-1.5 py-[1px] bg-[#14b8a6] text-white text-[10px] rounded shadow-sm animate-fadeIn">
                {y}
              </div>
            )}

            {/* Circular dot */}
            <button
              onClick={() => handleChange(y)}
              onMouseEnter={() => setHovered(y)}
              onMouseLeave={() => setHovered(null)}
              className={`
                z-10 w-2.5 h-2.5 cursor-pointer rounded-full flex items-center justify-center border border-white transition-all duration-200
                ${y === year
                  ? "bg-[#14b8a6] scale-110 shadow ring-1 ring-emerald-300"
                  : "bg-gray-300 hover:bg-gray-400 hover:scale-105"
                }
              `}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
