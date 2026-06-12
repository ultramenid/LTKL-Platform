import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KABUPATENS } from '../data/kabupatens.js';
import { YEAR_CONFIG } from '../config/constants.js';
import { useMapStore } from '../store/mapStore.js';
import { decodeAdministrasi } from '../utils/urlStateSync.js';
import ProfileHero from './profile/ProfileHero.jsx';
import ProfileNavBar from './profile/ProfileNavBar.jsx';
import ProfileContent from './profile/ProfileContent.jsx';
import ProfileFooter from './profile/ProfileFooter.jsx';

const NAV_TABS = [
  { id: 'news', label: 'Berita & Acara', accentVar: '--color-subject-berita' },
  {
    id: 'profile',
    label: 'Profil',
    accentVar: '--color-subject-profil',
    children: [
      { id: 'msf', label: 'Tentang MSF' },
      { id: 'regional', label: 'Informasi Daerah' },
      { id: 'partners', label: 'Daftar Mitra' },
    ],
  },
  { id: 'map', label: 'Peta Gotong Royong', accentVar: '--color-subject-peta' },
  {
    id: 'products',
    label: 'Produk Unggulan',
    accentVar: '--color-subject-produk',
    children: [
      { id: 'population', label: 'Populasi' },
      { id: 'economy', label: 'Ekonomi' },
      { id: 'commodity', label: 'Komoditas' },
      { id: 'supplychain', label: 'Rantai Pasok' },
    ],
  },
  { id: 'reports', label: 'Laporan / Pustaka', accentVar: '--color-subject-laporan' },
  { id: 'data', label: 'Data', accentVar: '--color-subject-data' },
  { id: 'contact', label: 'Kontak', accentVar: '--color-subject-kontak' },
];

const VALID_TAB_IDS = NAV_TABS.map((tab) => tab.id);
const DEFAULT_SEARCH_PARAMS = {
  tab: 'news',
  year: String(YEAR_CONFIG.DEFAULT),
  administrasi: 'all',
};
const subscribeToYear = () => () => {};
const getCurrentYear = () => new Date().getFullYear();
const getServerYear = () => null;

function resolveActiveSub(tab, requestedSubId) {
  if (!tab?.children) return null;
  const matchedChild = tab.children.find((child) => child.id === requestedSubId);
  return (matchedChild ?? tab.children[0]).id;
}

export function ProfilePage({ kabupatenName }) {
  const [searchParams, setSearchParams] = useSearchParams(DEFAULT_SEARCH_PARAMS);
  const currentYear = useSyncExternalStore(subscribeToYear, getCurrentYear, getServerYear);
  const initialDrillStateRef = useRef(null);

  const urlTab = searchParams.get('tab');
  const activeTabId = VALID_TAB_IDS.includes(urlTab) ? urlTab : 'news';
  const activeTab = NAV_TABS.find((tab) => tab.id === activeTabId);
  const activeSubId = resolveActiveSub(activeTab, searchParams.get('sub'));
  const urlYear = parseInt(searchParams.get('year')) || YEAR_CONFIG.DEFAULT;

  if (initialDrillStateRef.current === null) {
    initialDrillStateRef.current = decodeAdministrasi(
      searchParams.get('administrasi') || 'all',
    );
  }

  useEffect(() => {
    const subLabel = activeTab?.children?.find((child) => child.id === activeSubId)?.label;
    const tabLabel = subLabel ?? activeTab?.label ?? '';
    document.title = `${kabupatenName} · ${tabLabel} · LTKL Platform`;
  }, [kabupatenName, activeTab, activeSubId]);

  useEffect(() => {
    useMapStore.setState({ year: urlYear });
  }, [urlYear]);

  const selectTab = useCallback(
    (tabId, subId = null) => {
      setSearchParams(
        (previousParams) => {
          const updatedParams = new URLSearchParams(previousParams);
          updatedParams.set('tab', tabId);
          if (subId) updatedParams.set('sub', subId);
          else updatedParams.delete('sub');
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

  const districtRecord = KABUPATENS.find(
    (district) => district.name.toLowerCase() === kabupatenName.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      <ProfileHero kabupatenName={kabupatenName} districtRecord={districtRecord} />

      <ProfileNavBar
        tabs={NAV_TABS}
        activeTabId={activeTabId}
        activeSubId={activeSubId}
        onSelectTab={selectTab}
      />

      <ProfileContent
        activeTabId={activeTabId}
        activeSubId={activeSubId}
        kabupatenName={kabupatenName}
        initialDrillStateRef={initialDrillStateRef}
      />

      <ProfileFooter
        kabupatenName={kabupatenName}
        districtRecord={districtRecord}
        currentYear={currentYear}
        tabs={NAV_TABS}
        onSelectTab={selectTab}
      />
    </div>
  );
}
