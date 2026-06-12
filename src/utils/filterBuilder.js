// Helper functions to build CQL filters for WFS queries

// Single field filter: buildSingleFilter('kab','Bantul') → "kab='Bantul'"
export const buildSingleFilter = (fieldName, fieldValue) => {
  if (!fieldName || !fieldValue) return '';
  return `${fieldName}='${fieldValue}'`;
};

// Desa filter: requires kab + kec + des (3-level precision)
export const buildDesaFilter = (breadcrumbs) => {
  const { kab, kec, des } = breadcrumbs;
  if (!kab || !kec || !des) return '';
  return `kab='${kab}' AND kec='${kec}' AND des='${des}'`;
};
