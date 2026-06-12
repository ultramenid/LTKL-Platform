import { ArrowRight } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';

const NEWS_ACCENT = COLORS.PRIMARY;

const NEWS_ITEMS = [
  {
    id: 'annual-forum-2025',
    category: 'Acara',
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

export function NewsTab() {
  const featuredArticle = NEWS_ITEMS.find((item) => item.featured);
  const regularArticles = NEWS_ITEMS.filter((item) => !item.featured);

  return (
    <ProfileSection>
      <div>
        <SectionHeader kicker="Kabar Kabupaten" title="Berita & Acara" accent={NEWS_ACCENT} />

        {featuredArticle && (
          <article className="group cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6 md:gap-10 items-start border-b-2 border-coffee-900/80 pb-10">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.24em] mb-3"
                style={{ color: NEWS_ACCENT }}
              >
                {featuredArticle.category} Utama
              </p>
              <h2 className="text-2xl md:text-[2rem] font-extrabold text-coffee-900 leading-[1.15] tracking-tight group-hover:underline underline-offset-4 decoration-2">
                {featuredArticle.title}
              </h2>
              <p className="text-[11px] text-coffee-600 uppercase tracking-[0.12em] mt-3">
                {featuredArticle.date} — {featuredArticle.author}
              </p>
              <p className="text-sm text-coffee-700 leading-relaxed mt-4">
                {featuredArticle.excerpt}
              </p>
              <span
                className="inline-flex items-center gap-1.5 mt-5 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: NEWS_ACCENT }}
              >
                Baca Selengkapnya
                <ArrowRight
                  size={12}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </div>
            <div className="border border-coffee-900/20 p-1.5 bg-white">
              <div className="overflow-hidden">
                <img
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  className="w-full h-56 md:h-72 object-cover sepia-[0.18] saturate-[0.9] group-hover:scale-[1.03] transition-transform duration-700"
                />
              </div>
            </div>
          </article>
        )}

        <div>
          {regularArticles.map((article) => (
            <article
              key={article.id}
              className="group cursor-pointer grid grid-cols-[1fr_auto] sm:grid-cols-[8rem_1fr_auto] gap-x-6 gap-y-2 items-start py-6 border-b border-coffee-900/15"
            >
              <div className="hidden sm:block pt-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: NEWS_ACCENT }}
                >
                  {article.category}
                </p>
                <p className="text-[11px] text-coffee-600 tabular-nums mt-1 leading-snug">
                  {article.date}
                </p>
              </div>
              <div className="min-w-0">
                <p
                  className="sm:hidden text-[10px] font-bold uppercase tracking-[0.18em] mb-1"
                  style={{ color: NEWS_ACCENT }}
                >
                  {article.category} · {article.date}
                </p>
                <h3 className="text-base md:text-lg font-bold text-coffee-900 leading-snug tracking-tight group-hover:underline underline-offset-4">
                  {article.title}
                </h3>
                <p className="text-xs text-coffee-600 leading-relaxed mt-1.5 line-clamp-2 max-w-2xl">
                  {article.excerpt}
                </p>
                <p className="text-[10px] text-coffee-600/70 uppercase tracking-[0.12em] mt-2">
                  {article.author}
                </p>
              </div>
              <div className="border border-coffee-900/20 p-1 bg-white shrink-0">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover sepia-[0.18] saturate-[0.9]"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="pt-8 text-center">
          <button
            type="button"
            className="cursor-pointer inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-coffee-900 underline underline-offset-4 decoration-coffee-900/30 hover:decoration-coffee-900 transition-colors"
          >
            Lihat Semua Berita & Acara
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </ProfileSection>
  );
}
