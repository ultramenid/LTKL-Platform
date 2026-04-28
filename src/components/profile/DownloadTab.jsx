import { Database, Download, FileText, Map as MapIcon } from 'lucide-react';
import { COLORS, PROFILE_DOWNLOAD_DUMMY_FILES } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

function getDownloadCategoryIcon(categoryName) {
  if (categoryName === 'dataset') return <Database size={16} className="text-emerald-600" />;
  if (categoryName === 'map') return <MapIcon size={16} className="text-cyan-600" />;
  return <FileText size={16} className="text-amber-600" />;
}

export function DownloadTab() {
  return (
    <ProfileSection>
      <section className="space-y-6">
        <SectionHeader title="Unduhan Data" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700">Mode Dummy</p>
          <p className="mt-1 text-xs text-amber-600">
            Seluruh tombol unduh di tab ini masih dummy untuk kebutuhan rancangan antarmuka.
          </p>
        </div>

        <div className="space-y-3">
          {PROFILE_DOWNLOAD_DUMMY_FILES.map((downloadFile) => (
            <article
              key={downloadFile.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {getDownloadCategoryIcon(downloadFile.category)}
                    <p className="text-sm font-bold text-gray-900">{downloadFile.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{downloadFile.description}</p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
                >
                  <Download size={14} />
                  Unduh (Dummy)
                </button>
              </div>

              <div className="mt-3 grid gap-2 text-[11px] text-gray-500 md:grid-cols-3">
                <div>
                  <span className="font-semibold text-gray-600">Tipe:</span> {downloadFile.category}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Ukuran:</span> {downloadFile.size}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Pembaruan:</span> {downloadFile.updatedAt}
                </div>
              </div>
            </article>
          ))}
        </div>

        
      </section>
    </ProfileSection>
  );
}
