// Utility untuk sinkronisasi state dengan URL parameters
// Format: ?year=2024&administrasi=kab:Sintang,kec:Ketungau+Hilir&selectedKab=Sintang
import { YEAR_CONFIG } from "../config/constants.js";

// Encode breadcrumbs ke format administrasi parameter
export const encodeAdministrasi = (breadcrumbs) => {
  if (!breadcrumbs || Object.keys(breadcrumbs).length === 0) {
    return "all";
  }

  const parts = [];
  if (breadcrumbs.kab) parts.push(`kab:${encodeURIComponent(breadcrumbs.kab)}`);
  if (breadcrumbs.kec) parts.push(`kec:${encodeURIComponent(breadcrumbs.kec)}`);
  if (breadcrumbs.des) parts.push(`des:${encodeURIComponent(breadcrumbs.des)}`);

  return parts.join(",");
};

// Decode administrasi parameter ke breadcrumbs object
export const decodeAdministrasi = (administrasiParam) => {
  if (!administrasiParam || administrasiParam === "all") {
    return {};
  }

  const breadcrumbs = {};
  const parts = administrasiParam.split(",");

  for (const part of parts) {
    const [key, value] = part.split(":");
    if (key && value) {
      breadcrumbs[key] = decodeURIComponent(value);
    }
  }

  return breadcrumbs;
};

// Generate URL dengan state terkini
export const generateUrl = (year = YEAR_CONFIG.DEFAULT, breadcrumbs = {}, selectedKab = null) => {
  const administrasi = encodeAdministrasi(breadcrumbs);
  const params = new URLSearchParams();

  params.set("year", year);
  params.set("administrasi", administrasi);
  if (selectedKab) {
    params.set("selectedKab", encodeURIComponent(selectedKab));
  }

  return `${window.location.pathname}?${params.toString()}`;
};

// Update browser URL dengan state terkini (tanpa page reload)
export const updateUrl = (year = YEAR_CONFIG.DEFAULT, breadcrumbs = {}, selectedKab = null) => {
  const newUrl = generateUrl(year, breadcrumbs, selectedKab);
  window.history.replaceState(null, "", newUrl);
};

// Parse URL dan return state object
export const parseUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  
  const year = parseInt(params.get("year")) || YEAR_CONFIG.DEFAULT;
  const administrasiParam = params.get("administrasi") || "all";
  const breadcrumbs = decodeAdministrasi(administrasiParam);
  const selectedKab = params.get("selectedKab") ? decodeURIComponent(params.get("selectedKab")) : null;

  return { year, breadcrumbs, selectedKab };
};

// Initialize URL dengan default values jika kosong (hanya untuk map route)
export const initializeUrl = () => {
  // Hanya initialize URL state di map route (/), bukan di profile pages
  if (window.location.pathname !== "/") {
    return;
  }

  const { year, breadcrumbs, selectedKab } = parseUrlState();
  updateUrl(year, breadcrumbs, selectedKab);
};
