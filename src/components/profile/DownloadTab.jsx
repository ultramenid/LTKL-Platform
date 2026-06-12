import { Download } from 'lucide-react';
import { COLORS, PROFILE_DOWNLOAD_DUMMY_FILES } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';

const DATA_ACCENT = COLORS.PRIMARY;

export function DownloadTab() {
  return (
    <ProfileSection>
      <div>
        <SectionHeader kicker="Katalog Data" title="Unduhan Data" accent={DATA_ACCENT} />

        <div className="border border-dashed border-coffee-900/40 px-4 py-3 mb-8 max-w-xl">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: DATA_ACCENT }}
          >
            Mode Dummy
          </p>
          <p className="mt-1 text-xs text-coffee-600">
            Seluruh tombol unduh di tab ini masih dummy untuk kebutuhan rancangan antarmuka.
          </p>
        </div>

        <div className="border-t-2 border-coffee-900/80">
          {PROFILE_DOWNLOAD_DUMMY_FILES.map((downloadFile) => (
            <article
              key={downloadFile.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-4 gap-y-2 py-4 border-b border-coffee-900/15"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="text-sm font-bold text-coffee-900">{downloadFile.title}</p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: DATA_ACCENT }}
                  >
                    {downloadFile.category}
                  </p>
                </div>
                <p className="text-xs text-coffee-600 leading-relaxed mt-1 max-w-2xl">
                  {downloadFile.description}
                </p>
                <p className="text-[10px] text-coffee-600/70 uppercase tracking-[0.12em] tabular-nums mt-2">
                  {downloadFile.size} · Pembaruan {downloadFile.updatedAt}
                </p>
              </div>
              <button
                type="button"
                className="self-start cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-coffee-900 underline underline-offset-4 decoration-coffee-900/30 hover:decoration-coffee-900 transition-colors"
              >
                <Download size={11} aria-hidden="true" />
                Unduh (Dummy)
              </button>
            </article>
          ))}
        </div>
      </div>
    </ProfileSection>
  );
}
