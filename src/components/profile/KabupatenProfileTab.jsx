import { useState } from 'react';
import { Building2, Users, FileText, Download } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader, SubSectionHeader } from './ProfileSection.jsx';

// MSF organizational structure — placeholder, replace with real data per kabupaten
const MSF_STRUCTURE = [
  {
    position: 'Ketua Forum',
    holder: 'Drs. Ahmad Karim, M.Si.',
    institution: 'Pemerintah Kabupaten',
    sector: 'government',
  },
  {
    position: 'Wakil Ketua I',
    holder: 'Ir. Budi Santoso',
    institution: 'DPRD Kabupaten',
    sector: 'government',
  },
  {
    position: 'Wakil Ketua II',
    holder: 'Dr. Sri Wahyuni, M.M.',
    institution: 'Asosiasi Pengusaha Lokal',
    sector: 'private',
  },
  {
    position: 'Sekretaris',
    holder: 'Hendra Pratama, S.H.',
    institution: 'Sekretariat MSF',
    sector: 'secretariat',
  },
  {
    position: 'Bendahara',
    holder: 'Amelia Rosa, S.E., M.Ak.',
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

// Regional government data — placeholder per kabupaten
const REGIONAL_STATS = [
  { label: 'Ibukota', value: 'Sigi Biromaru' },
  { label: 'Luas Wilayah', value: '5.196,02 km²' },
  { label: 'Jumlah Kecamatan', value: '15' },
  { label: 'Jumlah Desa', value: '176' },
];

const REGIONAL_LEADERS = [
  { title: 'Bupati', name: 'Mohamad Irwan Lapatta, S.Sos., M.Si.' },
  { title: 'Wakil Bupati', name: 'Samuel Yansen Pongi, S.H.' },
];

const OPD_LIST = [
  { name: 'Badan Perencanaan Pembangunan Daerah', abbreviation: 'Bappeda', head: 'Dr. Ir. H. Hendra W., M.T.' },
  { name: 'Dinas Pertanian dan Ketahanan Pangan', abbreviation: 'Distan', head: 'Ir. Muh. Arif, M.P.' },
  { name: 'Dinas Kehutanan', abbreviation: 'Dishut', head: 'Andi Basri, S.Hut., M.Si.' },
  { name: 'Dinas Komunikasi dan Informatika', abbreviation: 'Diskominfo', head: 'Drs. Rizal Hamid' },
  { name: 'Dinas Pekerjaan Umum dan Penataan Ruang', abbreviation: 'DPUPR', head: 'Ir. Fakhri Abdillah, M.T.' },
  { name: 'Dinas Lingkungan Hidup', abbreviation: 'DLH', head: 'drh. Yuliana Dewi, M.Si.' },
  { name: 'Dinas Koperasi, UKM dan Perdagangan', abbreviation: 'Diskopdag', head: 'Drs. Rahmat Hidayat, M.M.' },
  { name: 'Badan Pengelola Keuangan dan Aset Daerah', abbreviation: 'BPKAD', head: 'Amelia Rosa, S.E., M.Ak.' },
];

// Development partners list — placeholder
const DEVELOPMENT_PARTNERS = [
  {
    id: 'giz',
    name: 'GIZ Indonesia',
    focusArea: 'Tata Kelola Hutan & Iklim',
    since: 2019,
    partnerType: 'Lembaga Kerjasama Teknik',
    description:
      'Mendukung penguatan kapasitas pemerintah daerah dalam pengelolaan hutan berkelanjutan dan adaptasi perubahan iklim.',
    typeColor: '#14b8a6',
  },
  {
    id: 'wwf',
    name: 'WWF Indonesia',
    focusArea: 'Konservasi Keanekaragaman Hayati',
    since: 2020,
    partnerType: 'NGO Internasional',
    description:
      'Program konservasi satwa liar dan ekosistem hutan tropis di wilayah kabupaten.',
    typeColor: '#6366f1',
  },
  {
    id: 'kehati',
    name: 'Yayasan KEHATI',
    focusArea: 'Keanekaragaman Hayati & Pertanian',
    since: 2021,
    partnerType: 'NGO Nasional',
    description:
      'Mendukung pengembangan pertanian berkelanjutan dan pelestarian keanekaragaman hayati lokal.',
    typeColor: '#8b5cf6',
  },
  {
    id: 'undp',
    name: 'UNDP Indonesia',
    focusArea: 'Pembangunan Berkelanjutan',
    since: 2020,
    partnerType: 'Badan PBB',
    description:
      'Program penguatan tata kelola daerah dan percepatan pencapaian Tujuan Pembangunan Berkelanjutan (SDGs).',
    typeColor: '#3b82f6',
  },
  {
    id: 'bni',
    name: 'PT Bank Negara Indonesia (BNI)',
    focusArea: 'Pemberdayaan UMKM & CSR',
    since: 2022,
    partnerType: 'BUMN / Sektor Swasta',
    description:
      'Program CSR difokuskan pada pemberdayaan UMKM lokal, akses pembiayaan petani, dan pengembangan komoditas unggulan.',
    typeColor: '#f59e0b',
  },
  {
    id: 'idh',
    name: 'IDH – The Sustainable Trade Initiative',
    focusArea: 'Komoditas Berkelanjutan',
    since: 2021,
    partnerType: 'Lembaga Internasional',
    description:
      'Mendukung transformasi rantai pasok komoditas pertanian menuju praktik yang lebih berkelanjutan dan berkeadilan.',
    typeColor: '#10b981',
  },
];

// Sector tag styling for MSF structure
const SECTOR_STYLES = {
  government: { bg: '#eff6ff', text: '#1d4ed8', label: 'Pemerintah' },
  private: { bg: '#fefce8', text: '#92400e', label: 'Swasta' },
  secretariat: { bg: '#f0fdf4', text: '#166534', label: 'Sekretariat' },
};

const PROFILE_SUB_TABS = [
  { id: 'msf', label: 'Tentang MSF' },
  { id: 'regional', label: 'Informasi Daerah' },
  { id: 'partners', label: 'Daftar Mitra' },
];

// Kabupaten profile: MSF info, regional government, and development partners
export function KabupatenProfileTab({ kabupaten }) {
  const [activeSubTab, setActiveSubTab] = useState('msf');

  return (
    <div>
      {/* Sub-tab navigation — sticky below the main dark nav bar */}
      <div className="border-b border-gray-200 bg-white sticky top-[49px] z-20">
        <div className="max-w-5xl mx-auto flex overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {PROFILE_SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 min-w-max px-5 py-2.5 text-sm font-semibold transition border-b-2 whitespace-nowrap text-center cursor-pointer ${
                activeSubTab === tab.id
                  ? 'text-teal-600 border-teal-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tentang MSF ── */}
      {activeSubTab === 'msf' && (
        <ProfileSection>
          <SectionHeader
            title={`Tentang Forum MSF ${kabupaten}`}
            borderColor={COLORS.PRIMARY}
            dotColor={COLORS.PRIMARY}
          />

          {/* About text + quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 items-start">
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                <strong className="text-gray-800">
                  Forum Multi-Stakeholder (MSF) {kabupaten}
                </strong>{' '}
                adalah platform kolaborasi multipihak yang mempertemukan pemerintah daerah, sektor
                swasta, masyarakat sipil, dan akademisi dalam satu wadah koordinasi pembangunan
                berkelanjutan.
              </p>
              <p>
                Forum ini dibentuk sebagai bagian dari jaringan{' '}
                <strong className="text-gray-800">
                  Lingkar Temu Kabupaten Lestari (LTKL)
                </strong>
                , sebuah asosiasi kabupaten yang berkomitmen mengintegrasikan prinsip keberlanjutan
                ke dalam tata kelola dan pembangunan daerah.
              </p>
              <p>
                MSF {kabupaten} berfungsi sebagai ruang dialog, perencanaan bersama, serta
                monitoring dan evaluasi program-program prioritas daerah yang berperspektif
                lingkungan hidup, ekonomi, dan sosial secara berimbang.
              </p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                Sekilas MSF
              </p>
              {[
                { label: 'Tahun Berdiri', value: '2019' },
                { label: 'Periode Pengurus', value: '2023 – 2026' },
                { label: 'Anggota Aktif', value: '45 Organisasi' },
                { label: 'Kelompok Kerja', value: '4 Pokja' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-gray-500">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Organizational structure */}
          <div>
            <SubSectionHeader title="Struktur Pengurus MSF" dotColor={COLORS.PRIMARY} />
            <div className="space-y-2">
              {MSF_STRUCTURE.map((member) => {
                const sectorStyle = SECTOR_STYLES[member.sector] ?? SECTOR_STYLES.government;
                return (
                  <div
                    key={member.position}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: sectorStyle.bg }}
                    >
                      <Users size={16} style={{ color: sectorStyle.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800">{member.holder}</p>
                      <p className="text-[10px] text-gray-500 truncate">{member.institution}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-gray-700">{member.position}</p>
                      <span
                        className="inline-block px-2 py-0.5 text-[8px] font-bold uppercase rounded-full"
                        style={{ backgroundColor: sectorStyle.bg, color: sectorStyle.text }}
                      >
                        {sectorStyle.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Working groups */}
          <div>
            <SubSectionHeader title="Kelompok Kerja (Pokja)" dotColor={COLORS.PRIMARY} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MSF_WORKING_GROUPS.map((group) => (
                <div
                  key={group.name}
                  className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <p className="text-xs font-bold text-gray-800 leading-snug mb-1">{group.name}</p>
                  <p className="text-[10px] text-gray-500">Lead: {group.lead}</p>
                  <p className="text-[10px] text-teal-600 mt-1 font-semibold">
                    {group.members} anggota
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SK and legal documents */}
          <div>
            <SubSectionHeader
              title="Surat Keputusan & Dokumen Hukum"
              dotColor={COLORS.PRIMARY}
            />
            <div className="space-y-2">
              {MSF_LEGAL_DOCUMENTS.map((doc) => (
                <div
                  key={doc.title}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">{doc.title}</p>
                    <p className="text-[10px] text-gray-500">
                      {doc.number} · {doc.date}
                    </p>
                  </div>
                  <a
                    href={doc.url}
                    className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <Download size={11} />
                    Unduh
                  </a>
                </div>
              ))}
            </div>
          </div>
        </ProfileSection>
      )}

      {/* ── Informasi Daerah ── */}
      {activeSubTab === 'regional' && (
        <ProfileSection>
          <SectionHeader
            title="Informasi Daerah"
            borderColor={COLORS.HIGHLIGHT}
            dotColor={COLORS.HIGHLIGHT}
          />

          {/* District quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {REGIONAL_STATS.map((item) => (
              <div key={item.label} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-lg font-black text-gray-800 mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Leadership cards */}
          <div>
            <SubSectionHeader title="Pimpinan Daerah" dotColor={COLORS.HIGHLIGHT} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REGIONAL_LEADERS.map((leader) => (
                <div
                  key={leader.title}
                  className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
                    <span className="text-xl text-white font-black">
                      {leader.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">
                      {leader.title}
                    </p>
                    <p className="text-sm font-bold text-gray-800 leading-snug">{leader.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OPD table */}
          <div>
            <SubSectionHeader
              title="Struktur OPD (Organisasi Perangkat Daerah)"
              dotColor={COLORS.HIGHLIGHT}
            />
            <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                      OPD
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                      Singkatan
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                      Kepala
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OPD_LIST.map((opd, index) => (
                    <tr
                      key={opd.abbreviation}
                      className={`border-b border-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{opd.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded">
                          {opd.abbreviation}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{opd.head}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ProfileSection>
      )}

      {/* ── Daftar Mitra ── */}
      {activeSubTab === 'partners' && (
        <ProfileSection>
          <SectionHeader
            title="Daftar Mitra Pembangunan"
            borderColor={COLORS.PRIMARY_TEXT}
            dotColor={COLORS.PRIMARY_TEXT}
          />
          <p className="text-sm text-gray-500 -mt-6">
            Organisasi dan lembaga yang aktif bermitra dalam program pembangunan berkelanjutan
            Kabupaten {kabupaten}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEVELOPMENT_PARTNERS.map((partner) => (
              <div
                key={partner.id}
                className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-gray-400" />
                  </div>
                  <span
                    className="mt-1 inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full text-white"
                    style={{ backgroundColor: partner.typeColor }}
                  >
                    {partner.partnerType}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{partner.name}</p>
                  <p className="text-[10px] text-teal-600 font-semibold mt-0.5">
                    {partner.focusArea}
                  </p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{partner.description}</p>
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400">
                    Mitra sejak{' '}
                    <strong className="text-gray-600">{partner.since}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}
    </div>
  );
}
