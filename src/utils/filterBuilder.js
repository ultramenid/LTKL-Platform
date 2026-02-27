// filepath: src/utils/filterBuilder.js
// Helper functions untuk build CQL filters untuk WFS queries

// Build filter satu field
// Contoh: buildSingleFilter('kab', 'Bantul') → "kab='Bantul'"
export const buildSingleFilter = (fieldName, fieldValue) => {
  if (!fieldName || !fieldValue) return '';
  return `${fieldName}='${fieldValue}'`;
};

// Build filter multiple field dengan AND condition
// Contoh: buildMultiFilter({ kab: 'Bantul', kec: 'Kraton' })
//         → "kab='Bantul' AND kec='Kraton'"
export const buildMultiFilter = (filterFields) => {
  const filterParts = [];
  
  if (filterFields.kab) filterParts.push(`kab='${filterFields.kab}'`);
  if (filterFields.kec) filterParts.push(`kec='${filterFields.kec}'`);
  if (filterFields.des) filterParts.push(`des='${filterFields.des}'`);
  
  return filterParts.join(' AND ');
};

// Build filter untuk desa level (butuh kab + kec + des)
// Contoh: buildDesaFilter({ kab: 'Bantul', kec: 'Kraton', des: 'Piyungan' })
//         → "kab='Bantul' AND kec='Kraton' AND des='Piyungan'"
export const buildDesaFilter = (breadcrumbs) => {
  const { kab, kec, des } = breadcrumbs;
  if (!kab || !kec || !des) return '';
  return `kab='${kab}' AND kec='${kec}' AND des='${des}'`;
};

// Build filter untuk kecamatan level (butuh kab + kec)
// Contoh: buildKecamatanFilter({ kab: 'Bantul', kec: 'Kraton' })
//         → "kab='Bantul' AND kec='Kraton'"
export const buildKecamatanFilter = (breadcrumbs) => {
  const { kab, kec } = breadcrumbs;
  if (!kab || !kec) return '';
  return `kab='${kab}' AND kec='${kec}'`;
};
