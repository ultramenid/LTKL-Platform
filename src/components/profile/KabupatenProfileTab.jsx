import { Download } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { SubSectionHeader } from './SubSectionHeader.jsx';

const PROFILE_ACCENT = COLORS.PRIMARY;

const MSF_STRUCTURE = [
  {
    position: 'Ketua Forum',
    holder: 'Nama Ketua',
    institution: 'Pemerintah Kabupaten',
    sector: 'government',
  },
  {
    position: 'Wakil Ketua I',
    holder: 'Nama Wakil Ketua I',
    institution: 'DPRD Kabupaten',
    sector: 'government',
  },
  {
    position: 'Wakil Ketua II',
    holder: 'Nama Wakil Ketua II',
    institution: 'Asosiasi Pengusaha Lokal',
    sector: 'private',
  },
  {
    position: 'Sekretaris',
    holder: 'Nama Sekretaris',
    institution: 'Sekretariat MSF',
    sector: 'secretariat',
  },
  {
    position: 'Bendahara',
    holder: 'Nama Bendahara',
    institution: 'Dinas Keuangan Daerah',
    sector: 'government',
  },
];

const MSF_WORKING_GROUPS = [
  { name: 'Kelompok Kerja Data & Informasi', lead: 'Dinas Komunikasi dan Informatika', members: 6 },
  { name: 'Kelompok Kerja Perencanaan', lead: 'Bappeda', members: 8 },
  { name: 'Kelompok Kerja Kerjasama', lead: 'Bagian Kerjasama Setda', members: 5 },
  { name: 'Kelompok Kerja Komoditas & Ekonomi', lead: 'Dinas Pertanian', members: 7 },
];

const MSF_LEGAL_DOCUMENTS = [
  {
    title: 'SK Pembentukan Forum MSF',
    number: 'Keputusan Bupati No. 188.45/123/BUPATI/2023',
    date: '15 Januari 2023',
    url: '#',
  },
  {
    title: 'SK Pengukuhan Pengurus MSF Periode 2023–2026',
    number: 'Keputusan Bupati No. 188.45/456/BUPATI/2023',
    date: '20 Maret 2023',
    url: '#',
  },
  {
    title: 'AD/ART Forum Multi-Stakeholder',
    number: 'MSF/ART/2023',
    date: '20 Maret 2023',
    url: '#',
  },
];

const MSF_FACTS = [
  { label: 'Tahun Berdiri', value: '2019' },
  { label: 'Periode Pengurus', value: '2023 – 2026' },
  { label: 'Anggota Aktif', value: '45 Organisasi' },
  { label: 'Kelompok Kerja', value: '4 Pokja' },
];

const REGIONAL_STATS = [
  { label: 'Ibukota', value: 'Sigi Biromaru' },
  { label: 'Luas Wilayah', value: '5.196,02 km²' },
  { label: 'Jumlah Kecamatan', value: '15' },
  { label: 'Jumlah Desa', value: '176' },
];

const REGIONAL_LEADERS = [
  { title: 'Bupati', name: 'Nama Bupati' },
  { title: 'Wakil Bupati', name: 'Nama Wakil Bupati' },
];

const OPD_LIST = [
  {
    name: 'Badan Perencanaan Pembangunan Daerah',
    abbreviation: 'Bappeda',
    head: 'Nama Kepala Bappeda',
  },
  {
    name: 'Dinas Pertanian dan Ketahanan Pangan',
    abbreviation: 'Distan',
    head: 'Nama Kepala Distan',
  },
  { name: 'Dinas Kehutanan', abbreviation: 'Dishut', head: 'Nama Kepala Dishut' },
  {
    name: 'Dinas Komunikasi dan Informatika',
    abbreviation: 'Diskominfo',
    head: 'Nama Kepala Diskominfo',
  },
  {
    name: 'Dinas Pekerjaan Umum dan Penataan Ruang',
    abbreviation: 'DPUPR',
    head: 'Nama Kepala DPUPR',
  },
  { name: 'Dinas Lingkungan Hidup', abbreviation: 'DLH', head: 'Nama Kepala DLH' },
  {
    name: 'Dinas Koperasi, UKM dan Perdagangan',
    abbreviation: 'Diskopdag',
    head: 'Nama Kepala Diskopdag',
  },
  {
    name: 'Badan Pengelola Keuangan dan Aset Daerah',
    abbreviation: 'BPKAD',
    head: 'Nama Kepala BPKAD',
  },
];

const DEVELOPMENT_PARTNERS = [
  {
    id: 'partner1',
    name: 'Nama Partner 1',
    focusArea: 'Tata Kelola Hutan & Iklim',
    since: 2019,
    partnerType: 'Lembaga Kerjasama Teknik',
    description:
      'Mendukung penguatan kapasitas pemerintah daerah dalam pengelolaan hutan berkelanjutan dan adaptasi perubahan iklim.',
  },
  {
    id: 'partner2',
    name: 'Nama Partner 2',
    focusArea: 'Konservasi Keanekaragaman Hayati',
    since: 2020,
    partnerType: 'NGO Internasional',
    description: 'Program konservasi satwa liar dan ekosistem hutan tropis di wilayah kabupaten.',
  },
  {
    id: 'partner3',
    name: 'Nama Partner 3',
    focusArea: 'Keanekaragaman Hayati & Pertanian',
    since: 2021,
    partnerType: 'NGO Nasional',
    description:
      'Mendukung pengembangan pertanian berkelanjutan dan pelestarian keanekaragaman hayati lokal.',
  },
  {
    id: 'partner4',
    name: 'Nama Partner 4',
    focusArea: 'Pembangunan Berkelanjutan',
    since: 2020,
    partnerType: 'Badan PBB',
    description:
      'Program penguatan tata kelola daerah dan percepatan pencapaian Tujuan Pembangunan Berkelanjutan (SDGs).',
  },
  {
    id: 'partner5',
    name: 'Nama Partner 5',
    focusArea: 'Pemberdayaan UMKM & CSR',
    since: 2022,
    partnerType: 'BUMN / Sektor Swasta',
    description:
      'Program CSR difokuskan pada pemberdayaan UMKM lokal, akses pembiayaan petani, dan pengembangan komoditas unggulan.',
  },
  {
    id: 'partner6',
    name: 'Nama Partner 6',
    focusArea: 'Komoditas Berkelanjutan',
    since: 2021,
    partnerType: 'Lembaga Internasional',
    description:
      'Mendukung transformasi rantai pasok komoditas pertanian menuju praktik yang lebih berkelanjutan dan berkeadilan.',
  },
];

const SECTOR_LABELS = {
  government: { color: '#4338ca', label: 'Pemerintah' },
  private: { color: '#b45309', label: 'Swasta' },
  secretariat: { color: '#047857', label: 'Sekretariat' },
};

function DotLeaderRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-coffee-600 shrink-0">
        {label}
      </span>
      <span
        className="flex-1 border-b border-dotted border-coffee-900/30 -translate-y-[3px]"
        aria-hidden="true"
      />
      <span className="font-bold text-coffee-900 tabular-nums shrink-0">{value}</span>
    </div>
  );
}

function MsfSection({ kabupaten }) {
  return (
    <ProfileSection>
      <div>
        <SectionHeader
          kicker="Profil"
          title={`Tentang Forum MSF ${kabupaten}`}
          accent={PROFILE_ACCENT}
        />

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-10 items-start">
          <div className="space-y-4 text-sm text-coffee-700 leading-relaxed">
            <p className="text-base leading-relaxed first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-[0.85] first-letter:text-coffee-900">
              <strong className="text-coffee-900">Forum Multi-Stakeholder (MSF) {kabupaten}</strong>{' '}
              adalah platform kolaborasi multipihak yang mempertemukan pemerintah daerah, sektor
              swasta, masyarakat sipil, dan akademisi dalam satu wadah koordinasi pembangunan
              berkelanjutan.
            </p>
            <p>
              Forum ini dibentuk sebagai bagian dari jaringan{' '}
              <strong className="text-coffee-900">Lingkar Temu Kabupaten Lestari (LTKL)</strong>,
              sebuah asosiasi kabupaten yang berkomitmen mengintegrasikan prinsip keberlanjutan ke
              dalam tata kelola dan pembangunan daerah.
            </p>
            <p>
              MSF {kabupaten} berfungsi sebagai ruang dialog, perencanaan bersama, serta monitoring
              dan evaluasi program-program prioritas daerah yang berperspektif lingkungan hidup,
              ekonomi, dan sosial secara berimbang.
            </p>
          </div>

          <div className="border-y-2 border-coffee-900/80 py-4 space-y-3">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ color: PROFILE_ACCENT }}
            >
              Sekilas MSF
            </p>
            {MSF_FACTS.map((fact) => (
              <DotLeaderRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>
        </div>
      </div>

      <div>
        <SubSectionHeader title="Struktur Pengurus MSF" accent={PROFILE_ACCENT} />
        <div className="border-t-2 border-coffee-900/80">
          {MSF_STRUCTURE.map((member) => {
            const sector = SECTOR_LABELS[member.sector] ?? SECTOR_LABELS.government;
            return (
              <div
                key={member.position}
                className="grid grid-cols-[7rem_1fr_auto] sm:grid-cols-[10rem_1fr_auto] items-baseline gap-x-4 py-3 border-b border-coffee-900/15"
              >
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-coffee-600">
                  {member.position}
                </p>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-coffee-900">{member.holder}</p>
                  <p className="text-xs text-coffee-600 truncate">{member.institution}</p>
                </div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: sector.color }}
                >
                  {sector.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SubSectionHeader title="Kelompok Kerja (Pokja)" accent={PROFILE_ACCENT} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          {MSF_WORKING_GROUPS.map((group) => (
            <div key={group.name} className="py-4 border-t border-coffee-900/15">
              <p className="text-sm font-bold text-coffee-900 leading-snug">{group.name}</p>
              <p className="text-xs text-coffee-600 mt-1">
                Lead: {group.lead} · <span className="font-semibold">{group.members} anggota</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SubSectionHeader title="Surat Keputusan & Dokumen Hukum" accent={PROFILE_ACCENT} />
        <div className="border-t-2 border-coffee-900/80">
          {MSF_LEGAL_DOCUMENTS.map((document) => (
            <div
              key={document.title}
              className="flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-1 py-3 border-b border-coffee-900/15"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-coffee-900">{document.title}</p>
                <p className="text-xs text-coffee-600 tabular-nums">
                  {document.number} · {document.date}
                </p>
              </div>
              <a
                href={document.url}
                className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-coffee-900 underline underline-offset-4 decoration-coffee-900/30 hover:decoration-coffee-900 transition-colors"
              >
                <Download size={11} aria-hidden="true" />
                Unduh
              </a>
            </div>
          ))}
        </div>
      </div>
    </ProfileSection>
  );
}

function RegionalSection() {
  return (
    <ProfileSection>
      <div>
        <SectionHeader kicker="Profil" title="Informasi Daerah" accent={PROFILE_ACCENT} />

        <div className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-coffee-900/80 divide-x divide-coffee-900/15">
          {REGIONAL_STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-4">
              <p className="text-[9px] text-coffee-600 uppercase tracking-[0.15em] font-semibold">
                {stat.label}
              </p>
              <p className="text-lg md:text-xl font-bold text-coffee-900 tabular-nums mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SubSectionHeader title="Pimpinan Daerah" accent={PROFILE_ACCENT} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          {REGIONAL_LEADERS.map((leader) => (
            <div
              key={leader.title}
              className="flex items-center gap-4 py-4 border-t border-coffee-900/15"
            >
              <div className="w-12 h-12 bg-coffee-900 flex items-center justify-center shrink-0">
                <span className="text-lg text-parchment-50 font-black">
                  {leader.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-coffee-600 uppercase tracking-[0.15em] font-semibold">
                  {leader.title}
                </p>
                <p className="text-sm font-bold text-coffee-900 leading-snug mt-0.5">
                  {leader.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SubSectionHeader
          title="Struktur OPD (Organisasi Perangkat Daerah)"
          accent={PROFILE_ACCENT}
        />
        <table className="w-full text-xs border-t-2 border-coffee-900/80">
          <thead>
            <tr className="border-b border-coffee-900/30">
              <th className="text-left px-1 py-2.5 font-bold text-coffee-600 uppercase tracking-[0.15em] text-[9px]">
                OPD
              </th>
              <th className="text-left px-1 py-2.5 font-bold text-coffee-600 uppercase tracking-[0.15em] text-[9px]">
                Singkatan
              </th>
              <th className="text-left px-1 py-2.5 font-bold text-coffee-600 uppercase tracking-[0.15em] text-[9px]">
                Kepala
              </th>
            </tr>
          </thead>
          <tbody>
            {OPD_LIST.map((opd) => (
              <tr key={opd.abbreviation} className="border-b border-coffee-900/10">
                <td className="px-1 py-3 font-semibold text-coffee-900">{opd.name}</td>
                <td className="px-1 py-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: PROFILE_ACCENT }}
                  >
                    {opd.abbreviation}
                  </span>
                </td>
                <td className="px-1 py-3 text-coffee-600">{opd.head}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProfileSection>
  );
}

function PartnersSection({ kabupaten }) {
  return (
    <ProfileSection>
      <div>
        <SectionHeader kicker="Profil" title="Daftar Mitra Pembangunan" accent={PROFILE_ACCENT} />
        <p className="text-sm text-coffee-600 -mt-2 mb-6 max-w-xl">
          Organisasi dan lembaga yang aktif bermitra dalam program pembangunan berkelanjutan
          Kabupaten {kabupaten}.
        </p>

        <div className="border-t-2 border-coffee-900/80">
          {DEVELOPMENT_PARTNERS.map((partner) => (
            <div
              key={partner.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 border-b border-coffee-900/15"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="text-sm font-bold text-coffee-900">{partner.name}</p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: PROFILE_ACCENT }}
                  >
                    {partner.partnerType}
                  </p>
                </div>
                <p className="text-xs font-semibold text-coffee-700 mt-0.5">{partner.focusArea}</p>
                <p className="text-xs text-coffee-600 leading-relaxed mt-1.5 max-w-2xl">
                  {partner.description}
                </p>
              </div>
              <p className="text-[10px] text-coffee-600 uppercase tracking-[0.12em] sm:text-right">
                Sejak{' '}
                <span className="font-bold text-coffee-900 tabular-nums">{partner.since}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </ProfileSection>
  );
}

export function KabupatenProfileTab({ kabupaten, activeSubTab }) {
  if (activeSubTab === 'regional') return <RegionalSection />;
  if (activeSubTab === 'partners') return <PartnersSection kabupaten={kabupaten} />;
  return <MsfSection kabupaten={kabupaten} />;
}
