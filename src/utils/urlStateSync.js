// Utility for syncing state with URL parameters
// Format: ?year=2024&administrasi=kab:Sintang,kec:Ketungau+Hilir&selectedKab=Sintang
import { YEAR_CONFIG } from '../config/constants.js';

// Encode breadcrumbs into administrasi parameter format
export const encodeAdministrasi = (breadcrumbs) => {
  if (!breadcrumbs || Object.keys(breadcrumbs).length === 0) {
    return 'all';
  }

  const parts = [];
  if (breadcrumbs.kab) parts.push(`kab:${encodeURIComponent(breadcrumbs.kab)}`);
  if (breadcrumbs.kec) parts.push(`kec:${encodeURIComponent(breadcrumbs.kec)}`);
  if (breadcrumbs.des) parts.push(`des:${encodeURIComponent(breadcrumbs.des)}`);

  return parts.join(',');
};

// Decode administrasi parameter into breadcrumbs object
export const decodeAdministrasi = (administrasiParam) => {
  if (!administrasiParam || administrasiParam === 'all') {
    return {};
  }

  const breadcrumbs = {};
  const parts = administrasiParam.split(',');

  for (const part of parts) {
    const [key, value] = part.split(':');
    if (key && value) {
      breadcrumbs[key] = decodeURIComponent(value);
    }
  }

  return breadcrumbs;
};

// Generate URL with current state
export const generateUrl = (year = YEAR_CONFIG.DEFAULT, breadcrumbs = {}, selectedKab = null) => {
  const administrasi = encodeAdministrasi(breadcrumbs);
  const params = new URLSearchParams();

  params.set('year', year);
  params.set('administrasi', administrasi);
  if (selectedKab) {
    params.set('selectedKab', encodeURIComponent(selectedKab));
  }

  return `${window.location.pathname}?${params.toString()}`;
};

// Update browser URL with current state (without page reload)
export const updateUrl = (year = YEAR_CONFIG.DEFAULT, breadcrumbs = {}, selectedKab = null) => {
  const newUrl = generateUrl(year, breadcrumbs, selectedKab);
  window.history.replaceState(null, '', newUrl);
};

// Parse URL and return state object
export const parseUrlState = () => {
  const params = new URLSearchParams(window.location.search);

  const year = parseInt(params.get('year')) || YEAR_CONFIG.DEFAULT;
  const administrasiParam = params.get('administrasi') || 'all';
  const breadcrumbs = decodeAdministrasi(administrasiParam);
  const selectedKab = params.get('selectedKab')
    ? decodeURIComponent(params.get('selectedKab'))
    : null;

  return { year, breadcrumbs, selectedKab };
};

// Initialize URL with default values if empty (only for map route)
export const initializeUrl = () => {
  // Only initialize URL state on map route (/), not on profile pages
  if (window.location.pathname !== '/') {
    return;
  }

  const { year, breadcrumbs, selectedKab } = parseUrlState();
  updateUrl(year, breadcrumbs, selectedKab);
};
