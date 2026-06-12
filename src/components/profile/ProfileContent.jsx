import { ErrorBoundary } from '../ErrorBoundary.jsx';
import { NewsTab } from './NewsTab.jsx';
import { KabupatenProfileTab } from './KabupatenProfileTab.jsx';
import { MapTab } from './MapTab.jsx';
import { ProdukUnggulanTab } from './ProdukUnggulanTab.jsx';
import { ReportsTab } from './ReportsTab.jsx';
import { DownloadTab } from './DownloadTab.jsx';
import { ContactTab } from './ContactTab.jsx';

export default function ProfileContent({
  activeTabId,
  activeSubId,
  kabupatenName,
  initialDrillStateRef,
}) {
  return (
    <ErrorBoundary label="Konten tab">
      <div className="paper-grain bg-parchment-50">
        {activeTabId === 'news' && <NewsTab />}
        {activeTabId === 'profile' && (
          <KabupatenProfileTab kabupaten={kabupatenName} activeSubTab={activeSubId} />
        )}
        {activeTabId === 'map' && (
          <MapTab
            key={kabupatenName}
            kabupaten={kabupatenName}
            initialDrillState={initialDrillStateRef.current}
          />
        )}
        {activeTabId === 'products' && (
          <ProdukUnggulanTab kabupaten={kabupatenName} activeSubTab={activeSubId} />
        )}
        {activeTabId === 'reports' && <ReportsTab />}
        {activeTabId === 'data' && <DownloadTab />}
        {activeTabId === 'contact' && <ContactTab />}
      </div>
    </ErrorBoundary>
  );
}
