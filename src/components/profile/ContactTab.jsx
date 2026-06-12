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

const CONTACT_ACCENT = COLORS.PRIMARY;

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
  },
  {
    icon: Phone,
    label: 'Telepon',
    value: CONTACT_DETAILS.phone,
    href: `tel:${CONTACT_DETAILS.phone.replace(/\s/g, '')}`,
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: CONTACT_DETAILS.whatsapp,
    href: `https://wa.me/${CONTACT_DETAILS.whatsapp.replace(/\D/g, '')}`,
  },
];

const SOCIAL_MEDIA = [
  {
    icon: Instagram,
    label: 'Instagram',
    value: CONTACT_DETAILS.instagram.handle,
    href: CONTACT_DETAILS.instagram.url,
  },
  {
    icon: Facebook,
    label: 'Facebook',
    value: CONTACT_DETAILS.facebook.handle,
    href: CONTACT_DETAILS.facebook.url,
  },
  {
    icon: Youtube,
    label: 'YouTube',
    value: CONTACT_DETAILS.youtube.handle,
    href: CONTACT_DETAILS.youtube.url,
  },
  {
    icon: Twitter,
    label: 'Twitter / X',
    value: CONTACT_DETAILS.twitter.handle,
    href: CONTACT_DETAILS.twitter.url,
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
      background: #be185d;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      cursor: pointer;
    `;

    new maplibregl.Marker({ element: markerElement })
      .setLngLat(coordinates)
      .setPopup(
        new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(
          `<div style="font-size:12px;font-weight:700;color:#be185d;padding:2px 0">${label}</div>`,
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

function DirectoryRow({ icon: IconComponent, label, value, href }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="group grid grid-cols-[6.5rem_1fr_auto] items-baseline gap-x-3 py-3 border-b border-coffee-900/15"
    >
      <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-coffee-600">
        {label}
      </span>
      <span className="text-sm font-bold text-coffee-900 group-hover:underline underline-offset-4 truncate">
        {value}
      </span>
      <IconComponent
        size={13}
        aria-hidden="true"
        className="text-coffee-600/50 group-hover:text-coffee-900 transition-colors translate-y-[2px]"
      />
    </a>
  );
}

export function ContactTab() {
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    CONTACT_DETAILS.address,
  )}`;

  return (
    <ProfileSection>
      <div>
        <SectionHeader kicker="Sekretariat MSF" title="Kontak" accent={CONTACT_ACCENT} />

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 items-start">
          <div className="border border-coffee-900/20 p-1.5 bg-white">
            <div className="h-80 md:h-[26rem] relative overflow-hidden">
              <SecretariatMap coordinates={CONTACT_DETAILS.coordinates} label="Sekretariat MSF" />
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-parchment-50/95 hover:bg-parchment-50 border border-coffee-900/20 text-[11px] font-bold uppercase tracking-[0.1em] text-coffee-900 transition-colors"
              >
                <ExternalLink size={11} aria-hidden="true" />
                Buka di Google Maps
              </a>
            </div>
          </div>

          <div className="space-y-9">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.24em] mb-3"
                style={{ color: CONTACT_ACCENT }}
              >
                Alamat Sekretariat
              </p>
              <div className="flex items-start gap-3 border-y-2 border-coffee-900/80 py-4">
                <MapPin
                  size={15}
                  aria-hidden="true"
                  className="shrink-0 mt-0.5"
                  style={{ color: CONTACT_ACCENT }}
                />
                <p className="text-sm font-semibold text-coffee-900 leading-relaxed">
                  {CONTACT_DETAILS.address}
                </p>
              </div>
            </div>

            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.24em] mb-1"
                style={{ color: CONTACT_ACCENT }}
              >
                Kontak Langsung
              </p>
              <div className="border-t border-coffee-900/30">
                {DIRECT_CONTACTS.map((contact) => (
                  <DirectoryRow key={contact.label} {...contact} />
                ))}
              </div>
            </div>

            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.24em] mb-1"
                style={{ color: CONTACT_ACCENT }}
              >
                Media Sosial
              </p>
              <div className="border-t border-coffee-900/30">
                {SOCIAL_MEDIA.map((platform) => (
                  <DirectoryRow key={platform.label} {...platform} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
