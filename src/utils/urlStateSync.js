// Utility for syncing state with URL parameters
// Format: ?year=2024&administrasi=kab:Sintang,kec:Ketungau+Hilir&selectedKab=Sintang
//         &chartStart=2013&chartEnd=2024
import { YEAR_CONFIG, MAPBIOMAS_YEAR_RANGE } from '../config/constants.js';

const CHART_DEFAULT_START = MAPBIOMAS_YEAR_RANGE.CHART_DEFAULT_START;
const CHART_DEFAULT_END = MAPBIOMAS_YEAR_RANGE.MAX;

// Clamp a URL-supplied chart year into the valid MapBiomas range, falling back
// to the default when the param is missing or not a number.
const clampChartYear = (rawValue, fallback) => {
  const parsed = parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, MAPBIOMAS_YEAR_RANGE.MIN), MAPBIOMAS_YEAR_RANGE.MAX);
};

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
const generateUrl = (
  year = YEAR_CONFIG.DEFAULT,
  breadcrumbs = {},
  selectedKab = null,
  chartStartYear = CHART_DEFAULT_START,
  chartEndYear = CHART_DEFAULT_END,
) => {
  const administrasi = encodeAdministrasi(breadcrumbs);
  const params = new URLSearchParams();

  params.set('year', year);
  params.set('administrasi', administrasi);
  if (selectedKab) {
    params.set('selectedKab', encodeURIComponent(selectedKab));
  }
  // Analytics year range — carried so shared links restore the chart scope
  params.set('chartStart', chartStartYear);
  params.set('chartEnd', chartEndYear);

  return `${window.location.pathname}?${params.toString()}`;
};

// Update browser URL with current state (without page reload)
export const updateUrl = (
  year = YEAR_CONFIG.DEFAULT,
  breadcrumbs = {},
  selectedKab = null,
  chartStartYear = CHART_DEFAULT_START,
  chartEndYear = CHART_DEFAULT_END,
) => {
  // The store rebuilds the whole query string from the map param set. Other
  // routes (profile pages) own their URL through React Router's useSearchParams
  // and carry their own params (tab/sub), so a store write here would clobber
  // them. Restrict this writer to the map route — same guard as initializeUrl.
  if (window.location.pathname !== '/') return;
  const newUrl = generateUrl(year, breadcrumbs, selectedKab, chartStartYear, chartEndYear);
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

  let chartStartYear = clampChartYear(params.get('chartStart'), CHART_DEFAULT_START);
  let chartEndYear = clampChartYear(params.get('chartEnd'), CHART_DEFAULT_END);
  // A range needs start < end; fall back to defaults if the link was tampered.
  if (chartStartYear >= chartEndYear) {
    chartStartYear = CHART_DEFAULT_START;
    chartEndYear = CHART_DEFAULT_END;
  }

  return { year, breadcrumbs, selectedKab, chartStartYear, chartEndYear };
};

// Initialize URL with default values if empty (only for map route)
export const initializeUrl = () => {
  // Only initialize URL state on map route (/), not on profile pages
  if (window.location.pathname !== '/') {
    return;
  }

  const { year, breadcrumbs, selectedKab, chartStartYear, chartEndYear } = parseUrlState();
  updateUrl(year, breadcrumbs, selectedKab, chartStartYear, chartEndYear);
};
