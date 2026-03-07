import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { KABUPATENS } from '../data/kabupatens.js';
import { COLORS } from '../config/constants.js';
import { PopulationTab }  from './profile/PopulationTab.jsx';
import { EconomyTab }     from './profile/EconomyTab.jsx';
import { CivicsTab }      from './profile/CivicsTab.jsx';
import { SupplyChainTab } from './profile/SupplyChainTab.jsx';

// ─── KONFIGURASI TAB NAVIGASI ───
// Disimpan di level modul karena tidak bergantung pada state atau props apapun
const NAV_TABS = [
  { id: 'population',  label: 'Population & Diversity', color: COLORS.PRIMARY      },
  { id: 'economy',     label: 'Economy',               color: COLORS.HIGHLIGHT     },
  { id: 'civics',      label: 'Civics',                color: COLORS.PRIMARY_TEXT  },
  { id: 'supplychain', label: 'Supply Chain',          color: COLORS.PRIMARY_TEXT  },
];

// ─── STATISTIK RINGKASAN DI HERO ───
const DATA_HERO_STATS = [
  { label: '1-YR POPULATION CHANGE',  value: '+2.1%',    sub: 'growth'         },
  { label: 'MEDIAN HOUSEHOLD INCOME', value: 'Rp 4,5Jt', sub: 'per month'      },
  { label: 'POPULATION',              value: '274,800',  sub: '2025 estimate'  },
  { label: 'POVERTY RATE',            value: '11.7%',    sub: '30,500 people'  },
  { label: 'MEDIAN AGE',              value: '34.2',     sub: 'years'           },
];

// Halaman profil analitik per kabupaten: hero → statistik → tab navigasi → konten
export function ProfilePage({ kabupatenName }) {
  const [activeSection, setActiveSection] = useState('population');

  const kabupatenRecord = KABUPATENS.find(
    (itemKabupaten) => itemKabupaten.name.toLowerCase() === kabupatenName.toLowerCase()
  );


  return (
    <div className="min-h-screen bg-white font-sans">


      {/* ─── HERO — latar gelap + foto lanskap ─── */}
      <div className="relative bg-gray-900 overflow-hidden">
        {/* Latar belakang foto */}
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-black/90" />
        
        
        {/* Navigasi kembali ke peta */}
        <div className="relative z-10 px-4 md:px-8 pt-5">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition">
            <ArrowLeft size={16} />
            Back to Map
          </Link>
          
        </div>


        {/* Judul halaman */}
        <div className="relative z-10 text-center py-8 md:py-10 px-4 md:px-8">
          <p className="text-white/50 uppercase text-[10px] tracking-[0.3em] font-semibold mb-4">Kabupaten · Sulawesi Tengah</p>
          <div className="flex items-center justify-center gap-5">
            {kabupatenRecord?.logoUrl && (
              <img
                src={kabupatenRecord.logoUrl}
                alt={`Logo ${kabupatenName}`}
                className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-lg"
              />
            )}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase">{kabupatenName}</h1>
          </div>
          <p className="text-white/50 text-xs mt-4 uppercase tracking-[0.2em]">Indonesia · 2025 Profile</p>
        </div>

        {/* Baris statistik ringkasan */}
        <div className="relative z-10 border-t border-white/10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-white/10 py-5 px-4 md:px-0">
            {DATA_HERO_STATS.map((itemStat) => (
              <div key={itemStat.label} className="px-5 text-center">
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">{itemStat.label}</p>
                <p className="text-white text-xl font-bold mt-1">{itemStat.value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{itemStat.sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tab navigasi — sticky agar selalu terlihat saat scroll */}
      <div className="sticky top-0 z-30 border-t border-white/10 bg-gray-900 shadow-md">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {NAV_TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setActiveSection(tabItem.id)}
              className={`cursor-pointer px-4 md:px-8 py-3 text-sm font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeSection === tabItem.id ? 'text-white border-white' : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

     

      {/* ─── Konten per tab — masing-masing komponen mandiri ─── */}
      {activeSection === 'population'  && <PopulationTab  />}
      {activeSection === 'economy'     && <EconomyTab     />}
      {activeSection === 'civics'      && <CivicsTab      />}
      {activeSection === 'supplychain' && <SupplyChainTab />}

      {/* ─── FOOTER ─── */}
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

