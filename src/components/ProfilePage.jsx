import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { KABUPATENS } from '../data/kabupatens.js';
import { COLORS, YEAR_CONFIG } from '../config/constants.js';
import { useMapStore } from '../store/mapStore.js';
import { encodeAdministrasi, decodeAdministrasi } from '../utils/urlStateSync.js';
import { PopulationTab }  from './profile/PopulationTab.jsx';
import { EconomyTab }     from './profile/EconomyTab.jsx';
import { SupplyChainTab } from './profile/SupplyChainTab.jsx';
import { CommodityTab }   from './profile/Comodity.jsx';
import { MapTab }         from './profile/MapTab.jsx';
import { DownloadTab }    from './profile/DownloadTab.jsx';

// ─── TAB NAVIGATION CONFIGURATION (stored at module level, not state/props dependent) ───
// Disimpan di level modul karena tidak bergantung pada state atau props apapun
const NAV_TABS = [
  { id: 'population',  label: 'Populasi',    color: COLORS.PRIMARY     },
  { id: 'economy',     label: 'Ekonomi',     color: COLORS.HIGHLIGHT   },
  { id: 'commodity',   label: 'Komoditas',   color: COLORS.HIGHLIGHT   },
  { id: 'supplychain', label: 'Rantai Pasok', color: COLORS.PRIMARY_TEXT },
  { id: 'map',         label: 'Peta',      color: COLORS.PRIMARY   },
  { id: 'download',    label: 'Unduhan',   color: COLORS.HIGHLIGHT },
];

// ─── HERO SECTION STATISTICS (ringkasan statistik di bagian hero) ───
const HERO_STATS = [
  { label: 'PENDUDUK MISKIN 2025',  value: '30,500',    sub: 'Jiwa'         },
  { label: 'PDRB ADHK 2025', value: 'Rp 9.300', sub: 'trilliun'      },
  { label: 'POPULATION 2025',              value: '274,800',  sub: 'Jiwa'  },
  { label: 'RATA-RATA PENGELUARAN 2025 (Rumah Tangga)',            value: '4,5 Juta',    sub: '/bulan'  },
  { label: 'SEKTOR UNGGULAN',              value: 'Pertanian',     sub: '45% dari total PDRB'           },
];

// ─── VALID TAB IDS (untuk validasi URL sebelum digunakan) ───
const VALID_TAB_IDS = NAV_TABS.map((tab) => tab.id);

// Analytic profile page untuk kabupaten: hero → stats → tab nav → content
export function ProfilePage({ kabupatenName }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── BACA STATE DARI URL ───────────────────────────────────────────────────
  const urlTab          = searchParams.get('tab');
  const activeTab       = VALID_TAB_IDS.includes(urlTab) ? urlTab : 'population';
  const urlYear         = parseInt(searchParams.get('year')) || YEAR_CONFIG.DEFAULT;
  const urlAdministrasi = searchParams.get('administrasi') || 'all';

  // Decode drill state SEKALI saat mount agar tidak reset posisi MapTab setiap URL update
  const initialDrillStateRef = useRef(decodeAdministrasi(urlAdministrasi));

  // ─── INISIALISASI GLOBAL YEAR & URL PARAMS ──────────────────────────────────
  // Memastikan year, tab, dan administrasi selalu ada di URL sejak pertama dibuka
  // sehingga link bisa langsung dibagikan tanpa harus masuk ke tab peta dulu.
  useEffect(() => {
    useMapStore.getState().setYear(urlYear);
    setSearchParams((previousParams) => {
      const updatedParams = new URLSearchParams(previousParams);
      if (!updatedParams.has('tab')) updatedParams.set('tab', activeTab);
      // Year dan administrasi hanya ditambahkan saat berada di tab peta
      if (activeTab === 'map') {
        if (!updatedParams.has('year'))         updatedParams.set('year', String(urlYear));
        if (!updatedParams.has('administrasi')) updatedParams.set('administrasi', urlAdministrasi);
      }
      return updatedParams;
    }, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  // Ganti tab; year & administrasi hanya dipertahankan saat masuk tab peta
  const selectTab = useCallback((tabId) => {
    setSearchParams((previousParams) => {
      const updatedParams = new URLSearchParams(previousParams);
      updatedParams.set('tab', tabId);
      if (tabId !== 'map') {
        updatedParams.delete('year');
        updatedParams.delete('administrasi');
      }
      return updatedParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Dipanggil MapTab saat year atau drill state berubah agar URL selalu sinkron
  const handleMapStateChange = useCallback((selectedYear, drillBreadcrumbs) => {
    // Simpan posisi drill terkini agar dipulihkan saat user kembali ke tab peta
    initialDrillStateRef.current = drillBreadcrumbs;
    setSearchParams((previousParams) => {
      const updatedParams = new URLSearchParams(previousParams);
      updatedParams.set('year', String(selectedYear));
      updatedParams.set('administrasi', encodeAdministrasi(drillBreadcrumbs));
      return updatedParams;
    }, { replace: true });
  }, [setSearchParams]);

  const districtRecord = KABUPATENS.find(
    (district) => district.name.toLowerCase() === kabupatenName.toLowerCase()
  );


  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ─── HERO SECTION (dark gradient background + landscape image) ───*/}
      <div className="relative bg-gray-900 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-black/90" />
        
        
        {/* Back to map navigation */}
        <div className="relative z-10 px-4 md:px-8 pt-5">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition">
            <ArrowLeft size={16} />
            Back to Map
          </Link>
        </div>
        

        {/* Page title with district logo */}
        <div className="relative z-10 text-center py-8 md:py-10 px-4 md:px-8">
          <p className="text-white/50 uppercase text-[10px] tracking-[0.3em] font-semibold mb-4">Kabupaten · Sulawesi Tengah</p>
          <div className="flex items-center justify-center gap-5">
            {districtRecord?.logoUrl && (
              <img
                src={districtRecord.logoUrl}
                alt={`Logo ${kabupatenName}`}
                className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-lg"
              />
            )}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase">{kabupatenName}</h1>
          </div>
          
        </div>

        {/* Summary statistics row */}
        <div className="relative z-10 border-t border-white/10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-white/10 py-5 px-4 md:px-0">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="px-5 text-center">
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">{stat.label}</p>
                <p className="text-white text-xl font-bold mt-1">{stat.value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── TAB NAVIGATION (sticky, permanent visibility while scrolling) ───*/}
      <div className="sticky top-0 z-30 border-t border-white/10 bg-gray-900 shadow-md">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`cursor-pointer px-4 md:px-8 py-3 text-sm font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === tab.id ? 'text-white border-white' : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      

      

      {/* ─── CONTENT PER TAB (each component manages its own state) ───*/}
      {activeTab === 'population'  && <PopulationTab  />}
      {activeTab === 'economy'     && <EconomyTab     />}
      {activeTab === 'commodity'   && <CommodityTab   />}
      {activeTab === 'supplychain' && <SupplyChainTab kabupaten={kabupatenName.toUpperCase()} />}
      {activeTab === 'map' && (
        <MapTab
          kabupaten={kabupatenName}
          initialDrillState={initialDrillStateRef.current}
          onStateChange={handleMapStateChange}
        />
      )}
      {activeTab === 'download' && <DownloadTab />}

      {/* ─── FOOTER ───*/}
      <div className="bg-gray-900 text-white px-4 md:px-8 py-8 mt-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="font-bold text-sm">Kabupaten {kabupatenName} Profile</p>
            <p className="text-white/50 text-xs mt-1">Data sources: BPS, Pemerintah Daerah, Indonesia Open Data</p>
          </div>
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition">
            <ArrowLeft size={16} />
            Back to Map
          </Link>
        </div>
      </div>
    </div>
  );
}

