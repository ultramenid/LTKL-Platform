// filepath: src/utils/filterBuilder.js
// Helper functions untuk build CQL filters untuk WFS queries

// Filter satu field: buildSingleFilter('kab','Bantul') → "kab='Bantul'"
export const buildSingleFilter = (fieldName, fieldValue) => {
  if (!fieldName || !fieldValue) return '';
  return `${fieldName}='${fieldValue}'`;
};

// Filter multiple fields dengan AND — kab, kec, des
export const buildMultiFilter = (filterFields) => {
  const filterParts = [];
  
  if (filterFields.kab) filterParts.push(`kab='${filterFields.kab}'`);
  if (filterFields.kec) filterParts.push(`kec='${filterFields.kec}'`);
  if (filterFields.des) filterParts.push(`des='${filterFields.des}'`);
  
  return filterParts.join(' AND ');
};

// Filter desa: butuh kab + kec + des (presisi 3-level)
export const buildDesaFilter = (breadcrumbs) => {
  const { kab, kec, des } = breadcrumbs;
  if (!kab || !kec || !des) return '';
  return `kab='${kab}' AND kec='${kec}' AND des='${des}'`;
};

// Filter kecamatan: butuh kab + kec
export const buildKecamatanFilter = (breadcrumbs) => {
  const { kab, kec } = breadcrumbs;
  if (!kab || !kec) return '';
  return `kab='${kab}' AND kec='${kec}'`;
};
