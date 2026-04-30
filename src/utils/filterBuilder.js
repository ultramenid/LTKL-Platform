// Helper functions to build CQL filters for WFS queries

// Single field filter: buildSingleFilter('kab','Bantul') → "kab='Bantul'"
export const buildSingleFilter = (fieldName, fieldValue) => {
  if (!fieldName || !fieldValue) return '';
  return `${fieldName}='${fieldValue}'`;
};

// Multiple fields with AND — kab, kec, des
export const buildMultiFilter = (filterFields) => {
  const filterParts = [];

  if (filterFields.kab) filterParts.push(`kab='${filterFields.kab}'`);
  if (filterFields.kec) filterParts.push(`kec='${filterFields.kec}'`);
  if (filterFields.des) filterParts.push(`des='${filterFields.des}'`);

  return filterParts.join(' AND ');
};

// Desa filter: requires kab + kec + des (3-level precision)
export const buildDesaFilter = (breadcrumbs) => {
  const { kab, kec, des } = breadcrumbs;
  if (!kab || !kec || !des) return '';
  return `kab='${kab}' AND kec='${kec}' AND des='${des}'`;
};

// Kecamatan filter: requires kab + kec
export const buildKecamatanFilter = (breadcrumbs) => {
  const { kab, kec } = breadcrumbs;
  if (!kab || !kec) return '';
  return `kab='${kab}' AND kec='${kec}'`;
};
