import { FileText, Download, BookOpen } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

// Annual MSF reports — placeholder, replace with API data
const ANNUAL_REPORTS = [
  {
    id: 'ar-2024',
    title: 'Laporan Tahunan MSF 2024',
    year: 2024,
    pages: 84,
    size: '6.2 MB',
    description:
      'Rangkuman seluruh kegiatan, capaian program, dan rekomendasi kebijakan MSF sepanjang tahun 2024.',
    downloadUrl: '#',
  },
  {
    id: 'ar-2023',
    title: 'Laporan Tahunan MSF 2023',
    year: 2023,
    pages: 76,
    size: '5.8 MB',
    description:
      'Laporan komprehensif kegiatan MSF 2023 mencakup monev program, dinamika multipihak, dan proyeksi 2024.',
    downloadUrl: '#',
  },
  {
    id: 'ar-2022',
    title: 'Laporan Tahunan MSF 2022',
    year: 2022,
    pages: 68,
    size: '4.9 MB',
    description:
      'Dokumentasi kegiatan dan capaian forum tahun 2022, termasuk agenda pemulihan pascapandemi.',
    downloadUrl: '#',
  },
];

// Knowledge documents and publications — placeholder
const KNOWLEDGE_DOCUMENTS = [
  {
    id: 'panduan-operasional',
    title: 'Panduan Operasional Forum MSF',
    category: 'Pedoman',
    year: 2023,
    size: '2.1 MB',
    description:
      'Dokumen acuan tata cara penyelenggaraan Forum Multi-Stakeholder, mekanisme pengambilan keputusan, dan pengelolaan sekretariat.',
    downloadUrl: '#',
  },
  {
    id: 'strategi-pembangunan-lestari',
    title: 'Strategi Pembangunan Lestari Kabupaten 2024–2029',
    category: 'Strategi',
    year: 2024,
    size: '3.7 MB',
    description:
      'Dokumen strategis jangka menengah yang mengintegrasikan target SDGs ke dalam rencana pembangunan daerah.',
    downloadUrl: '#',
  },
  {
    id: 'baseline-lulc',
    title: 'Baseline Tutupan Lahan 2020–2024',
    category: 'Data & Analisis',
    year: 2024,
    size: '8.4 MB',
    description:
      'Analisis mendalam perubahan tutupan lahan berbasis MapBiomas dan interpretasi implikasinya terhadap program konservasi.',
    downloadUrl: '#',
  },
  {
    id: 'panduan-kakao',
    title: 'Panduan Pengembangan Kakao Berkelanjutan',
    category: 'Teknis',
    year: 2023,
    size: '1.9 MB',
    description:
      'Panduan teknis budi daya kakao berkelanjutan yang mengintegrasikan praktik baik dan standar sertifikasi internasional.',
    downloadUrl: '#',
  },
];

const CATEGORY_COLORS = {
  Pedoman: '#14b8a6',
  Strategi: '#6366f1',
  'Data & Analisis': '#f59e0b',
  Teknis: '#10b981',
};

// Reports & knowledge library tab
export function ReportsTab() {
  return (
    <ProfileSection>
      <SectionHeader
        title="Laporan / Pustaka"
        borderColor={COLORS.PRIMARY}
        dotColor={COLORS.PRIMARY}
      />

      {/* Annual reports list */}
      <div>
        <SubSectionHeader title="Laporan Tahunan MSF" dotColor={COLORS.PRIMARY} />
        <div className="space-y-3">
          {ANNUAL_REPORTS.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <BookOpen size={20} className="text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{report.title}</p>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-bold rounded">
                    {report.year}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{report.description}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {report.pages} halaman · {report.size}
                </p>
              </div>
              <a
                href={report.downloadUrl}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
              >
                <Download size={12} />
                Unduh
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge documents grid */}
      <div>
        <SubSectionHeader title="Dokumen & Publikasi Pengetahuan" dotColor={COLORS.PRIMARY} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {KNOWLEDGE_DOCUMENTS.map((doc) => {
            const categoryColor = CATEGORY_COLORS[doc.category] ?? COLORS.PRIMARY;
            return (
              <div
                key={doc.id}
                className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <span
                    className="mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full text-white"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {doc.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-snug">{doc.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {doc.year} · {doc.size}
                  </p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{doc.description}</p>
                <a
                  href={doc.downloadUrl}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <Download size={11} />
                  Unduh Dokumen
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </ProfileSection>
  );
}
