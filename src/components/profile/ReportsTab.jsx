import { BarChart3, BookOpen } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader } from './ProfileSection.jsx';

// ─── LAPORAN ITEMS ────────────────────────────────────────────────────────
const LAPORAN_ITEMS = [
  {
    id: 'ar-2024',
    title: 'Laporan Tahunan MSF 2024',
    description: 'Rangkuman seluruh kegiatan, capaian program, dan rekomendasi kebijakan MSF sepanjang tahun 2024.',
    size: '6.2 MB',
    updated: '15 Februari 2025',
  },
  {
    id: 'ar-2023',
    title: 'Laporan Tahunan MSF 2023',
    description: 'Laporan komprehensif kegiatan MSF 2023 mencakup monev program, dinamika multipihak, dan proyeksi 2024.',
    size: '5.8 MB',
    updated: '10 Januari 2024',
  },
  {
    id: 'ar-2022',
    title: 'Laporan Tahunan MSF 2022',
    description: 'Dokumentasi kegiatan dan capaian forum tahun 2022, termasuk agenda pemulihan pascapandemi.',
    size: '4.9 MB',
    updated: '5 Maret 2023',
  },
];

// ─── PUSTAKA ITEMS ────────────────────────────────────────────────────────
const PUSTAKA_ITEMS = [
  {
    id: 'strategi-pembangunan-lestari',
    title: 'Strategi Pembangunan Lestari Kabupaten 2024–2029',
    category: 'Strategi',
    categoryColor: '#6366f1',
    description: 'Dokumen strategis jangka menengah yang mengintegrasikan target SDGs ke dalam rencana pembangunan daerah.',
    size: '3.7 MB',
    updated: '20 April 2024',
  },
  {
    id: 'baseline-lulc',
    title: 'Baseline Tutupan Lahan 2020–2024',
    category: 'Data & Analisis',
    categoryColor: '#f59e0b',
    description: 'Analisis mendalam perubahan tutupan lahan berbasis MapBiomas dan interpretasi implikasinya terhadap program konservasi.',
    size: '8.4 MB',
    updated: '12 Maret 2024',
  },
  {
    id: 'panduan-operasional',
    title: 'Panduan Operasional Forum MSF',
    category: 'Pedoman',
    categoryColor: '#14b8a6',
    description: 'Dokumen acuan tata cara penyelenggaraan Forum Multi-Stakeholder, mekanisme pengambilan keputusan, dan pengelolaan sekretariat.',
    size: '2.1 MB',
    updated: '28 Januari 2023',
  },
  {
    id: 'panduan-kakao',
    title: 'Panduan Pengembangan Kakao Berkelanjutan',
    category: 'Teknis',
    categoryColor: '#10b981',
    description: 'Panduan teknis budi daya kakao berkelanjutan yang mengintegrasikan praktik baik dan standar sertifikasi internasional.',
    size: '1.9 MB',
    updated: '15 November 2023',
  },
];

// ─── Combined flat list (laporan first, then pustaka) ─────────────────────
const ALL_ITEMS = [
  ...LAPORAN_ITEMS.map((item) => ({ ...item, type: 'Laporan', icon: BarChart3, iconColor: '#14b8a6' })),
  ...PUSTAKA_ITEMS.map((item) => ({ ...item, type: 'Pustaka', icon: BookOpen, iconColor: '#6366f1' })),
];

export function ReportsTab() {
  return (
    <ProfileSection>
      <section className="space-y-6">
        <SectionHeader
          title="Laporan / Pustaka"
          borderColor={COLORS.PRIMARY}
          dotColor={COLORS.PRIMARY}
        />

        <div className="space-y-3">
          {ALL_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <article
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <IconComponent size={18} style={{ color: item.iconColor }} />
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    </div>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
                  >
                    Unduh
                  </button>
                </div>

                <div className="mt-3 grid gap-2 text-[11px] text-gray-500 md:grid-cols-3">
                  <div>
                    <span className="font-semibold text-gray-600">Tipe:</span> {item.type}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Ukuran:</span> {item.size}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Pembaruan:</span>{' '}
                    {item.updated}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </ProfileSection>
  );
}
