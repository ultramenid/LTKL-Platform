import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { KABUPATENS } from '../data/kabupatens.js';
import { COLORS, PROFILE_HERO_IMAGE_URL, YEAR_CONFIG } from '../config/constants.js';
import { useMapStore } from '../store/mapStore.js';
import { encodeAdministrasi, decodeAdministrasi } from '../utils/urlStateSync.js';
import { NewsTab } from './profile/NewsTab.jsx';
import { KabupatenProfileTab } from './profile/KabupatenProfileTab.jsx';
import { MapTab } from './profile/MapTab.jsx';
import { ProdukUnggulanTab } from './profile/ProdukUnggulanTab.jsx';
import { ReportsTab } from './profile/ReportsTab.jsx';
import { DownloadTab } from './profile/DownloadTab.jsx';
import { ContactTab } from './profile/ContactTab.jsx';

// ─── TAB NAVIGATION (stored at module level) ───
// Stored at module level so tab references are stable and don't trigger component re-render
const NAV_TABS = [
  { id: 'news', label: 'Berita & Acara' },
  { id: 'profile', label: 'Profil' },
  { id: 'map', label: 'Peta Gotong Royong' },
  { id: 'products', label: 'Produk Unggulan' },
  { id: 'reports', label: 'Laporan / Pustaka' },
  { id: 'data', label: 'Data' },
  { id: 'contact', label: 'Kontak' },
];

// ─── HERO STATISTICS (summary at top of page) ───
const HERO_STATS = [
  { label: 'PENDUDUK MISKIN 2025', value: '30,500', sub: 'Jiwa' },
  { label: 'PDRB ADHK 2025', value: 'Rp 9.300', sub: 'trilliun' },
  { label: 'JUMLAH PENDUDUK 2025', value: '274,800', sub: 'Jiwa' },
  { label: 'RATA-RATA PENGELUARAN 2025 (Rumah Tangga)', value: '4,5 Juta', sub: '/bulan' },
  { label: 'SEKTOR UNGGULAN', value: 'Pertanian', sub: '45% dari total PDRB' },
];

// ─── VALID TAB ID LIST (for URL validation) ───
const VALID_TAB_IDS = NAV_TABS.map((tab) => tab.id);

// Kabupaten analytics profile page: hero → stats → tab → content
export function ProfilePage({ kabupatenName }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── READ STATE FROM URL ───────────────────────────────────────────────────
  const urlTab = searchParams.get('tab');
  const activeTab = VALID_TAB_IDS.includes(urlTab) ? urlTab : 'news';
  const urlYear = parseInt(searchParams.get('year')) || YEAR_CONFIG.DEFAULT;
  const urlAdministrasi = searchParams.get('administrasi') || 'all';

  // Decode drill state ONCE on mount so MapTab position doesn't reset on every URL update
  const initialDrillStateRef = useRef(decodeAdministrasi(urlAdministrasi));

  // ─── GLOBAL YEAR & URL PARAMS INIT ──────────────────────────────────────────
  // Ensure year, tab, and administrasi are always in the URL from first open
  // so the link can be shared without needing to enter the map tab first.
  useEffect(() => {
    useMapStore.getState().setYear(urlYear);
    setSearchParams(
      (previousParams) => {
        const updatedParams = new URLSearchParams(previousParams);
        if (!updatedParams.has('tab')) updatedParams.set('tab', activeTab);
        // Year and administrasi only added when in map tab
        if (activeTab === 'map') {
          if (!updatedParams.has('year')) updatedParams.set('year', String(urlYear));
          if (!updatedParams.has('administrasi'))
            updatedParams.set('administrasi', urlAdministrasi);
        }
        return updatedParams;
      },
      { replace: true },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  // Switch tab; year & administrasi only preserved when entering map tab
  const selectTab = useCallback(
    (tabId) => {
      setSearchParams(
        (previousParams) => {
          const updatedParams = new URLSearchParams(previousParams);
          updatedParams.set('tab', tabId);
          if (tabId !== 'map') {
            updatedParams.delete('year');
            updatedParams.delete('administrasi');
          }
          return updatedParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Called by MapTab when year or drill state changes to keep URL in sync
  const handleMapStateChange = useCallback(
    (selectedYear, drillBreadcrumbs) => {
      // Save current drill position so it's restored when user returns to map tab
      initialDrillStateRef.current = drillBreadcrumbs;
      setSearchParams(
        (previousParams) => {
          const updatedParams = new URLSearchParams(previousParams);
          updatedParams.set('year', String(selectedYear));
          updatedParams.set('administrasi', encodeAdministrasi(drillBreadcrumbs));
          return updatedParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const districtRecord = KABUPATENS.find(
    (district) => district.name.toLowerCase() === kabupatenName.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── HERO SECTION (dark gradient + background image) ───*/}
      <div className="relative bg-gray-900 overflow-hidden">
        {/* Background image centralized in constants for easy cross-page changes */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url("${PROFILE_HERO_IMAGE_URL}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-black/90" />

        {/* Back navigation to map so user doesn't lose exploration context */}
        <div className="relative z-10 px-4 md:px-8 pt-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition"
          >
            <ArrowLeft size={16} />
            Kembali ke Peta
          </Link>
        </div>

        {/* Page title and kabupaten logo */}
        <div className="relative z-10 text-center py-8 md:py-10 px-4 md:px-8">
          <p className="text-white/50 uppercase text-[10px] tracking-[0.3em] font-semibold mb-4">
            Kabupaten · Sulawesi Tengah
          </p>
          <div className="flex items-center justify-center gap-5">
            {districtRecord?.logoUrl && (
              <img
                src={districtRecord.logoUrl}
                alt={`Logo ${kabupatenName}`}
                className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-lg"
              />
            )}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase">
              {kabupatenName}
            </h1>
          </div>
        </div>

        {/* Stats summary row */}
        <div className="relative z-10 border-t border-white/10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-white/10 py-5 px-4 md:px-0">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="px-5 text-center">
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">
                  {stat.label}
                </p>
                <p className="text-white text-xl font-bold mt-1">{stat.value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION (sticky so always visible while scrolling) ───*/}
      <div className="sticky top-0 z-30 border-t border-white/10 bg-gray-900 shadow-md">
        <div className="max-w-5xl mx-auto flex overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`cursor-pointer flex-1 min-w-max py-3 px-4 text-sm font-semibold uppercase tracking-wider transition border-b-2 text-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white border-white'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB CONTENT (each component manages its own state) ───*/}
      {activeTab === 'news' && <NewsTab />}
      {activeTab === 'profile' && <KabupatenProfileTab kabupaten={kabupatenName} />}
      {activeTab === 'map' && (
        <MapTab
          kabupaten={kabupatenName}
          initialDrillState={initialDrillStateRef.current}
          onStateChange={handleMapStateChange}
        />
      )}
      {activeTab === 'products' && <ProdukUnggulanTab kabupaten={kabupatenName} />}
      {activeTab === 'reports' && <ReportsTab />}
      {activeTab === 'data' && <DownloadTab />}
      {activeTab === 'contact' && <ContactTab />}

      {/* ─── FOOTER ───*/}
      <footer className="bg-gray-950 text-white mt-16">
        {/* Main footer body */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1fr] gap-10">

          {/* Column 1: Brand */}
          <div className="space-y-5">
            {/* LTKL + Auriga logos side by side */}
            <div className="flex items-start gap-4">
              {/* LTKL — clip bottom whitespace with overflow-hidden */}
              <div className="overflow-hidden shrink-0" style={{ height: '70px' }}>
                <img
                  src="/logo/ltkl.png"
                  alt="Lingkar Temu Kabupaten Lestari"
                  className="w-auto brightness-0 invert"
                  style={{ height: '60px' }}
                />
              </div>
              <div className="w-px h-8 bg-white/20 shrink-0" />
              {/* Auriga Nusantara */}
              <img
                src="https://auriga.or.id/assets/logoauriga.png"
                alt="Auriga Nusantara"
                className="h-12 w-auto object-contain brightness-0 invert opacity-100 shrink-0"
              />
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Platform data dan kolaborasi multipihak untuk mendukung pembangunan
              kabupaten yang lestari, berkeadilan, dan berkelanjutan.
            </p>
          </div>

          {/* Column 2: Quick navigation */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Navigasi</p>
            <ul className="space-y-2.5">
              {['Berita & Acara', 'Profil', 'Peta Gotong Royong', 'Produk Unggulan', 'Laporan / Pustaka', 'Data', 'Kontak'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-white/50 hover:text-white/90 transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: District info */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Kabupaten</p>
            <div className="flex items-center gap-3">
              {districtRecord?.logoUrl && (
                <img
                  src={districtRecord.logoUrl}
                  alt={kabupatenName}
                  className="w-10 h-10 object-contain opacity-80"
                />
              )}
              <div>
                <p className="text-sm font-bold text-white/80">{kabupatenName}</p>
                <p className="text-[10px] text-white/40">Anggota LTKL</p>
              </div>
            </div>
            <ul className="space-y-2.5 mt-2">
              {[
                { label: 'Sekretariat MSF', value: 'Sigi Biromaru' },
                { label: 'Kontak', value: 'sekretariat.msf@sigikab.go.id' },
              ].map((item) => (
                <li key={item.label}>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">{item.label}</p>
                  <p className="text-xs text-white/55 mt-0.5 break-all">{item.value}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/30">
              © {new Date().getFullYear()} LTKL · Auriga Nusantara. Sumber data: BPS, Pemerintah Daerah, Indonesia Open Data.
            </p>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white/40 hover:text-white/80 transition-colors"
            >
              <ArrowLeft size={12} />
              Kembali ke Peta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
