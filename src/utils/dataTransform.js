// filepath: src/utils/dataTransform.js
// Helper functions untuk transform API responses ke format yang kita butuh

// Normalize response server ke format { year, data }
// Handle berbagai format: {year, data}, {"2024":[...]}, atau array langsung
export const normalizeServerResponse = (rawResponse, fallbackYear) => {
  if (!rawResponse) return null;

  // Format 1: Sudah normalized { year: N, data: [...] }
  if (rawResponse.year && Array.isArray(rawResponse.data)) {
    return { year: Number(rawResponse.year), data: rawResponse.data };
  }

  // Format 2: Object dengan key tahun { "2024": [...], "2025": [...] }
  const objectKeys = Object.keys(rawResponse);
  for (const yearKey of objectKeys) {
    if (/^\d{4}$/.test(yearKey) && Array.isArray(rawResponse[yearKey])) {
      return { year: Number(yearKey), data: rawResponse[yearKey] };
    }
  }

  // Format 3: Array data langsung
  if (Array.isArray(rawResponse)) {
    return { year: fallbackYear, data: rawResponse };
  }

  // Format 4: Fallback - cari array value pertama di object
  for (const yearKey of objectKeys) {
    if (Array.isArray(rawResponse[yearKey])) {
      return {
        year: rawResponse.year ? Number(rawResponse.year) : Number(yearKey) || fallbackYear,
        data: rawResponse[yearKey],
      };
    }
  }

  // Tidak ada format yang cocok
  return null;
};

// Transform [[name, value]...] menjadi {labels, values} untuk chart
export const transformDataForChart = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return { labels: [], values: [] };
  }

  // Parse setiap entry jadi {name, value}, filter kosong, urutkan descending
  const processedData = dataArray
    .map((dataEntry) => {
      const kabupateName = String((dataEntry && dataEntry[0]) || '').trim();
      const areaValue = Number((dataEntry && dataEntry[1]) || 0) || 0;
      return { kabupateName, areaValue };
    })
    .filter(({ kabupateName }) => kabupateName) // Buang entry tanpa nama
    .sort((entryA, entryB) => entryB.areaValue - entryA.areaValue); // Urutkan dari terbesar

  return {
    labels: processedData.map(item => item.kabupateName),
    values: processedData.map(item => item.areaValue),
  };
};

// Cek apakah item valid sebagai data entry [name, value]
export const isValidDataEntry = (dataItem) => {
  return (
    Array.isArray(dataItem) &&
    dataItem.length >= 2 &&
    typeof dataItem[0] === 'string' &&
    !isNaN(Number(dataItem[1]))
  );
};
