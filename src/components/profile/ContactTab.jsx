import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  ExternalLink,
} from 'lucide-react';
import { COLORS, MAP_CONFIG } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';

const CONTACT_DETAILS = {
  address: 'Jl. Dewi Sartika No. 47, Sigi Biromaru, Kabupaten Sigi, Sulawesi Tengah 94364',
  coordinates: [119.8503, -1.0667],
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

function SecretariatMap({ coordinates, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.STYLE_URL,
      center: coordinates,
      zoom: 4,
      attributionControl: false,
      cooperativeGestures: true,
    });

    mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    const markerElement = document.createElement('div');
    markerElement.style.cssText = `
      width: 14px; height: 14px;
      background: #14b8a6;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      cursor: pointer;
    `;

    new maplibregl.Marker({ element: markerElement })
      .setLngLat(coordinates)
      .setPopup(
        new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(
          `<div style="font-size:12px;font-weight:700;color:#0f766e;padding:2px 0">${label}</div>`,
        ),
      )
      .addTo(mapInstance);

    mapRef.current = mapInstance;

    return () => {
      try {
        if (mapRef.current) mapRef.current.remove();
      } catch (removeError) {
        void removeError;
      }
      mapRef.current = null;
    };
  }, [coordinates, label]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export function ContactTab() {
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    CONTACT_DETAILS.address,
  )}`;

  return (
    <ProfileSection>
      <SectionHeader title="Kontak" borderColor={COLORS.PRIMARY} dotColor={COLORS.PRIMARY} />

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-start">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-80 md:h-96 relative">
          <SecretariatMap coordinates={CONTACT_DETAILS.coordinates} label="Sekretariat MSF" />
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors shadow-sm"
          >
            <ExternalLink size={11} />
            Buka di Google Maps
          </a>
        </div>

        <div className="space-y-7">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
              Alamat Sekretariat
            </p>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={14} className="text-teal-600" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{CONTACT_DETAILS.address}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
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
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">
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

          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
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
                    <p className="text-xs font-semibold text-gray-700 truncate">{platform.value}</p>
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
