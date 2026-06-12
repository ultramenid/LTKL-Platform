import { Download } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { SubSectionHeader } from './SubSectionHeader.jsx';

const REPORTS_ACCENT = COLORS.PRIMARY;

const LAPORAN_ITEMS = [
  {
    id: 'ar-2024',
    title: 'Laporan Tahunan MSF 2024',
    description:
      'Rangkuman seluruh kegiatan, capaian program, dan rekomendasi kebijakan MSF sepanjang tahun 2024.',
    size: '6.2 MB',
    updated: '15 Februari 2025',
  },
  {
    id: 'ar-2023',
    title: 'Laporan Tahunan MSF 2023',
    description:
      'Laporan komprehensif kegiatan MSF 2023 mencakup monev program, dinamika multipihak, dan proyeksi 2024.',
    size: '5.8 MB',
    updated: '10 Januari 2024',
  },
  {
    id: 'ar-2022',
    title: 'Laporan Tahunan MSF 2022',
    description:
      'Dokumentasi kegiatan dan capaian forum tahun 2022, termasuk agenda pemulihan pascapandemi.',
    size: '4.9 MB',
    updated: '5 Maret 2023',
  },
];

const PUSTAKA_ITEMS = [
  {
    id: 'strategi-pembangunan-lestari',
    title: 'Strategi Pembangunan Lestari Kabupaten 2024–2029',
    category: 'Strategi',
    description:
      'Dokumen strategis jangka menengah yang mengintegrasikan target SDGs ke dalam rencana pembangunan daerah.',
    size: '3.7 MB',
    updated: '20 April 2024',
  },
  {
    id: 'baseline-lulc',
    title: 'Baseline Tutupan Lahan 2020–2024',
    category: 'Data & Analisis',
    description:
      'Analisis mendalam perubahan tutupan lahan berbasis MapBiomas dan interpretasi implikasinya terhadap program konservasi.',
    size: '8.4 MB',
    updated: '12 Maret 2024',
  },
  {
    id: 'panduan-operasional',
    title: 'Panduan Operasional Forum MSF',
    category: 'Pedoman',
    description:
      'Dokumen acuan tata cara penyelenggaraan Forum Multi-Stakeholder, mekanisme pengambilan keputusan, dan pengelolaan sekretariat.',
    size: '2.1 MB',
    updated: '28 Januari 2023',
  },
  {
    id: 'panduan-kakao',
    title: 'Panduan Pengembangan Kakao Berkelanjutan',
    category: 'Teknis',
    description:
      'Panduan teknis budi daya kakao berkelanjutan yang mengintegrasikan praktik baik dan standar sertifikasi internasional.',
    size: '1.9 MB',
    updated: '15 November 2023',
  },
];

function CatalogRow({ item }) {
  return (
    <article className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-4 gap-y-2 py-4 border-b border-coffee-900/15">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <p className="text-sm font-bold text-coffee-900">{item.title}</p>
          {item.category && (
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: REPORTS_ACCENT }}
            >
              {item.category}
            </p>
          )}
        </div>
        <p className="text-xs text-coffee-600 leading-relaxed mt-1 max-w-2xl">{item.description}</p>
        <p className="text-[10px] text-coffee-600/70 uppercase tracking-[0.12em] tabular-nums mt-2">
          {item.size} · Pembaruan {item.updated}
        </p>
      </div>
      <button
        type="button"
        className="self-start inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-coffee-900 underline underline-offset-4 decoration-coffee-900/30 hover:decoration-coffee-900 transition-colors cursor-pointer"
      >
        <Download size={11} aria-hidden="true" />
        Unduh
      </button>
    </article>
  );
}

export function ReportsTab() {
  return (
    <ProfileSection>
      <div>
        <SectionHeader kicker="Arsip & Dokumen" title="Laporan / Pustaka" accent={REPORTS_ACCENT} />

        <div className="space-y-12">
          <section>
            <SubSectionHeader title="Laporan Tahunan" accent={REPORTS_ACCENT} />
            <div className="border-t-2 border-coffee-900/80">
              {LAPORAN_ITEMS.map((item) => (
                <CatalogRow key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section>
            <SubSectionHeader title="Pustaka" accent={REPORTS_ACCENT} />
            <div className="border-t-2 border-coffee-900/80">
              {PUSTAKA_ITEMS.map((item) => (
                <CatalogRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </ProfileSection>
  );
}
