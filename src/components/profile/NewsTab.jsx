import { Calendar, User, ChevronRight, BookOpen } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader } from './ProfileSection.jsx';

// Dummy news and event posts — replace with API data when backend is ready
const NEWS_ITEMS = [
  {
    id: 'annual-forum-2025',
    category: 'Acara',
    categoryColor: '#f59e0b',
    title: 'Forum MSF Tahunan 2025: Sinergi Multipihak untuk Pembangunan Lestari',
    date: '28 April 2025',
    author: 'Sekretariat MSF',
    imageUrl:
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop',
    excerpt:
      'Forum Multi-Stakeholder kembali menggelar pertemuan tahunan yang dihadiri lebih dari 50 peserta dari pemerintah daerah, sektor swasta, dan masyarakat sipil untuk merumuskan agenda pembangunan berkelanjutan 2025–2030.',
    featured: true,
  },
  {
    id: 'lulc-training-2025',
    category: 'Berita',
    categoryColor: COLORS.PRIMARY,
    title: 'Pelatihan Analisis Tutupan Lahan untuk Aparatur Desa',
    date: '15 Maret 2025',
    author: 'Tim Data & Informasi',
    imageUrl:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop',
    excerpt:
      '30 aparatur desa mengikuti pelatihan analisis data tutupan lahan berbasis Google Earth Engine untuk meningkatkan kapasitas monitoring wilayah secara mandiri dan berkelanjutan.',
    featured: false,
  },
  {
    id: 'partner-coordination-q1',
    category: 'Berita',
    categoryColor: COLORS.PRIMARY,
    title: 'Koordinasi Mitra Pembangunan: Penyelarasan Program Q1 2025',
    date: '2 Maret 2025',
    author: 'Unit Kerjasama',
    imageUrl:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop',
    excerpt:
      'Pertemuan koordinasi bersama 12 mitra aktif membahas penyelarasan target program dan indikator capaian untuk kuartal pertama tahun 2025.',
    featured: false,
  },
  {
    id: 'cocoa-harvest-festival',
    category: 'Acara',
    categoryColor: '#f59e0b',
    title: 'Festival Panen Raya Kakao 2025',
    date: '10 Februari 2025',
    author: 'Unit Komoditas',
    imageUrl:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop',
    excerpt:
      'Festival tahunan merayakan panen kakao sebagai komoditas unggulan daerah, dihadiri ratusan petani dan didukung oleh jaringan mitra rantai pasok lokal dan nasional.',
    featured: false,
  },
  {
    id: 'data-review-q4-2024',
    category: 'Laporan',
    categoryColor: '#6366f1',
    title: 'Tinjauan Data Pembangunan Q4 2024: Capaian dan Tantangan',
    date: '20 Januari 2025',
    author: 'Tim Monitoring & Evaluasi',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
    excerpt:
      'Laporan tinjauan kuartal keempat 2024 merangkum capaian indikator pembangunan utama dan mengidentifikasi tantangan yang perlu ditangani pada tahun 2025.',
    featured: false,
  },
];

// News & Events tab — featured article at top, grid of regular posts below
export function NewsTab() {
  const featuredArticle = NEWS_ITEMS.find((item) => item.featured);
  const regularArticles = NEWS_ITEMS.filter((item) => !item.featured);

  return (
    <ProfileSection>
      <SectionHeader title="Berita & Acara" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      {/* Featured post — larger horizontal card */}
      {featuredArticle && (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm group cursor-pointer hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
            <div className="h-56 md:h-auto overflow-hidden">
              <img
                src={featuredArticle.imageUrl}
                alt={featuredArticle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-between bg-white">
              <div>
                <span
                  className="inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full mb-3 text-white"
                  style={{ backgroundColor: featuredArticle.categoryColor }}
                >
                  {featuredArticle.category}
                </span>
                <h2 className="text-lg font-black text-gray-900 leading-snug mb-3 group-hover:text-teal-600 transition-colors">
                  {featuredArticle.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-4">
                  {featuredArticle.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {featuredArticle.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={10} />
                    {featuredArticle.author}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600">
                  Selengkapnya <ChevronRight size={11} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular article grid — 2 columns on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {regularArticles.map((article) => (
          <div
            key={article.id}
            className="rounded-xl overflow-hidden border border-gray-100 shadow-sm group cursor-pointer hover:shadow-md transition-shadow bg-white"
          >
            <div className="h-44 overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <span
                className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full mb-2 text-white"
                style={{ backgroundColor: article.categoryColor }}
              >
                {article.category}
              </span>
              <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Calendar size={10} /> {article.date}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-600">
                  Selengkapnya <ChevronRight size={10} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      <div className="flex justify-center pt-2">
        <button className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-teal-300 hover:text-teal-600 transition-colors cursor-pointer">
          <BookOpen size={14} />
          Lihat Semua Berita & Acara
        </button>
      </div>
    </ProfileSection>
  );
}
