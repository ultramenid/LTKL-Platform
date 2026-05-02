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
      <div className="bg-gray-900 text-white px-4 md:px-8 py-8 mt-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="font-bold text-sm">Profil Kabupaten {kabupatenName}</p>
            <p className="text-white/50 text-xs mt-1">
              Sumber data: BPS, Pemerintah Daerah, Indonesia Open Data
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition"
          >
            <ArrowLeft size={16} />
            Kembali ke Peta
          </Link>
        </div>
      </div>
    </div>
  );
}
