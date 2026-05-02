import { MapPin, Mail, Phone, MessageCircle, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { COLORS } from '../../config/constants.js';
import { ProfileSection, SectionHeader } from './ProfileSection.jsx';

// Contact details — placeholder, replace with real secretariat data per kabupaten
const CONTACT_DETAILS = {
  address:
    'Jl. Dewi Sartika No. 47, Sigi Biromaru, Kabupaten Sigi, Sulawesi Tengah 94364',
  email: 'sekretariat.msf@sigikab.go.id',
  phone: '+62 451 123456',
  whatsapp: '+62 811 9999 888',
  instagram: { handle: '@msf_sigi', url: '#' },
  facebook: { handle: 'MSF Kabupaten Sigi', url: '#' },
  youtube: { handle: 'MSF Sigi Channel', url: '#' },
  twitter: { handle: '@msfsigi', url: '#' },
};

const DIRECT_CONTACTS = [
  {
    icon: Mail,
    label: 'Email',
    value: CONTACT_DETAILS.email,
    href: `mailto:${CONTACT_DETAILS.email}`,
    color: '#6366f1',
  },
  {
    icon: Phone,
    label: 'Telepon',
    value: CONTACT_DETAILS.phone,
    href: `tel:${CONTACT_DETAILS.phone.replace(/\s/g, '')}`,
    color: '#14b8a6',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: CONTACT_DETAILS.whatsapp,
    href: `https://wa.me/${CONTACT_DETAILS.whatsapp.replace(/\D/g, '')}`,
    color: '#22c55e',
  },
];

const SOCIAL_MEDIA = [
  {
    icon: Instagram,
    label: 'Instagram',
    value: CONTACT_DETAILS.instagram.handle,
    href: CONTACT_DETAILS.instagram.url,
    color: '#e1306c',
  },
  {
    icon: Facebook,
    label: 'Facebook',
    value: CONTACT_DETAILS.facebook.handle,
    href: CONTACT_DETAILS.facebook.url,
    color: '#1877f2',
  },
  {
    icon: Youtube,
    label: 'YouTube',
    value: CONTACT_DETAILS.youtube.handle,
    href: CONTACT_DETAILS.youtube.url,
    color: '#ff0000',
  },
  {
    icon: Twitter,
    label: 'Twitter / X',
    value: CONTACT_DETAILS.twitter.handle,
    href: CONTACT_DETAILS.twitter.url,
    color: '#1da1f2',
  },
];

// Contact tab — secretariat address, direct contacts, and social media
export function ContactTab() {
  const googleMapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    CONTACT_DETAILS.address,
  )}`;

  return (
    <ProfileSection>
      <SectionHeader title="Kontak" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-start">
        {/* Map placeholder — replace inner content with a real Google Maps iframe */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-80 md:h-96 bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
            <MapPin size={28} className="text-teal-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700 mb-1">Lokasi Sekretariat</p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              {CONTACT_DETAILS.address}
            </p>
          </div>
          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Buka di Google Maps
          </a>
        </div>

        {/* Contact information */}
        <div className="space-y-7">
          {/* Secretariat address */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Alamat Sekretariat
            </p>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={14} className="text-teal-600" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {CONTACT_DETAILS.address}
              </p>
            </div>
          </div>

          {/* Direct contact channels */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Kontak Langsung
            </p>
            <div className="space-y-2">
              {DIRECT_CONTACTS.map((contact) => (
                <a
                  key={contact.label}
                  href={contact.href}
                  target={contact.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${contact.color}18` }}
                  >
                    <contact.icon size={14} style={{ color: contact.color }} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                      {contact.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                      {contact.value}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Social media grid */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Media Sosial
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_MEDIA.map((platform) => (
                <a
                  key={platform.label}
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <platform.icon size={16} style={{ color: platform.color }} />
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400">{platform.label}</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {platform.value}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
