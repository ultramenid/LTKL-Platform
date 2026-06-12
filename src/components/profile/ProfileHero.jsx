import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { COLORS, PROFILE_HERO_IMAGE_URL } from '../../config/constants.js';

const HERO_STATS = [
  { label: 'Penduduk Miskin 2025', value: '26.030', sub: 'Jiwa' },
  { label: 'PDRB ADHK 2025', value: 'Rp 13.500', sub: 'Miliar' },
  { label: 'Jumlah Penduduk 2025', value: '279.140', sub: 'Jiwa' },
  { label: 'Pengeluaran 2025', value: '4,5 Juta', sub: 'Rumah tangga /bulan' },
  { label: 'Sektor Unggulan', value: 'Pertanian', sub: '45% dari total PDRB' },
];

export default function ProfileHero({ kabupatenName, districtRecord }) {
  return (
    <div className="relative bg-coffee-900 overflow-hidden">
      <img
        src={PROFILE_HERO_IMAGE_URL}
        alt="Pemandangan alam pegunungan"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-20 saturate-50"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${COLORS.PRIMARY}26, ${COLORS.PRIMARY}0D 40%, rgba(15, 41, 39, 0.95))`,
        }}
      />

      <div className="relative z-10 px-4 md:px-8 pt-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-parchment-200/60 hover:text-parchment-100 text-sm transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Peta
        </Link>
      </div>

      <div className="relative z-10 text-center py-10 md:py-14 px-4 md:px-8 atlas-page-rise">
        <div className="flex items-center justify-center gap-4 mb-5">
          <span className="h-px w-10 sm:w-16 bg-parchment-200/30" aria-hidden="true" />
          <p className="text-parchment-200/70 uppercase text-[10px] tracking-[0.35em] font-semibold">
            Kabupaten · Sulawesi Tengah
          </p>
          <span className="h-px w-10 sm:w-16 bg-parchment-200/30" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-center gap-5">
          {districtRecord?.logoUrl && (
            <img
              src={districtRecord.logoUrl}
              alt={`Logo ${kabupatenName}`}
              className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-lg"
            />
          )}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-parchment-50 tracking-tight uppercase">
            {kabupatenName}
          </h1>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-white/10 py-5 px-4 md:px-0">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="px-5">
              <p className="text-parchment-200/50 text-[9px] uppercase tracking-[0.15em] font-semibold">
                {stat.label}
              </p>
              <p className="text-parchment-50 text-xl md:text-2xl font-bold tabular-nums mt-1.5">
                {stat.value}
              </p>
              <p className="text-parchment-200/40 text-[10px] mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
