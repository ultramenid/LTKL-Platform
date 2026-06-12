import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ProfileFooter({
  kabupatenName,
  districtRecord,
  currentYear,
  tabs,
  onSelectTab,
}) {
  return (
    <footer className="bg-coffee-900 text-parchment-50 mt-16">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1fr] gap-10">
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="overflow-hidden shrink-0" style={{ height: '70px' }}>
              <img
                src="/logo/ltkl.png"
                alt="Lingkar Temu Kabupaten Lestari"
                className="w-auto brightness-0 invert"
                style={{ height: '60px' }}
              />
            </div>
            <div className="w-px h-8 bg-white/20 shrink-0" />
            <img
              src="https://auriga.or.id/assets/logoauriga.png"
              alt="Auriga Nusantara"
              className="h-12 w-auto object-contain brightness-0 invert shrink-0"
            />
          </div>
          <p className="text-sm text-parchment-200/50 leading-relaxed max-w-xs">
            Platform data dan kolaborasi multipihak untuk mendukung pembangunan kabupaten yang
            lestari, berkeadilan, dan berkelanjutan.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-bold text-parchment-200/50 uppercase tracking-[0.2em]">
            Navigasi
          </p>
          <ul className="space-y-2.5">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id, tab.children?.[0]?.id ?? null)}
                  className="text-sm text-parchment-200/50 hover:text-parchment-50 transition-colors cursor-pointer"
                >
                  {tab.label}
                </button>
                {tab.children && (
                  <ul className="mt-1.5 ml-4 space-y-1 border-l border-white/10 pl-3">
                    {tab.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onSelectTab(tab.id, child.id)}
                          className="text-xs text-parchment-200/35 hover:text-parchment-200/80 transition-colors cursor-pointer"
                        >
                          {child.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-bold text-parchment-200/50 uppercase tracking-[0.2em]">
            Kabupaten
          </p>
          <div className="flex items-center gap-3">
            {districtRecord?.logoUrl && (
              <img
                src={districtRecord.logoUrl}
                alt={kabupatenName}
                className="w-10 h-10 object-contain opacity-80"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-parchment-100/80">{kabupatenName}</p>
              <p className="text-[10px] text-parchment-200/50">Anggota LTKL</p>
            </div>
          </div>
          <ul className="space-y-2.5 mt-2">
            {[
              { label: 'Sekretariat MSF', value: 'Sigi Biromaru' },
              { label: 'Kontak', value: 'sekretariat.msf@sigikab.go.id' },
            ].map((item) => (
              <li key={item.label}>
                <p className="text-[10px] text-parchment-200/50 uppercase tracking-[0.15em]">
                  {item.label}
                </p>
                <p className="text-xs text-parchment-200/55 mt-0.5 break-all">{item.value}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-parchment-200/40">
            © {currentYear} LTKL · Auriga Nusantara. Sumber data: BPS, Pemerintah Daerah,
            Indonesia Open Data.
          </p>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[11px] font-medium text-parchment-200/50 hover:text-parchment-100/80 transition-colors"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            Kembali ke Peta
          </Link>
        </div>
      </div>
    </footer>
  );
}
