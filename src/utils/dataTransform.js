// Helper functions to transform API responses into the format we need

// Normalize server response to { year, data } format
// Handles multiple formats: {year, data}, {"2024":[...]}, or bare array
export const normalizeServerResponse = (rawResponse, fallbackYear) => {
  if (!rawResponse) return null;

  // Format 1: Already normalized { year: N, data: [...] }
  if (rawResponse.year && Array.isArray(rawResponse.data)) {
    return { year: Number(rawResponse.year), data: rawResponse.data };
  }

  // Format 2: Object with year keys { "2024": [...], "2025": [...] }
  const objectKeys = Object.keys(rawResponse);
  for (const yearKey of objectKeys) {
    if (/^\d{4}$/.test(yearKey) && Array.isArray(rawResponse[yearKey])) {
      return { year: Number(yearKey), data: rawResponse[yearKey] };
    }
  }

  // Format 3: Bare array
  if (Array.isArray(rawResponse)) {
    return { year: fallbackYear, data: rawResponse };
  }

  // Format 4: Fallback — find first array value in object
  for (const yearKey of objectKeys) {
    if (Array.isArray(rawResponse[yearKey])) {
      return {
        year: rawResponse.year ? Number(rawResponse.year) : Number(yearKey) || fallbackYear,
        data: rawResponse[yearKey],
      };
    }
  }

  // No matching format
  return null;
};

// Transform [[name, value]...] into {labels, values} for charts
export const transformDataForChart = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return { labels: [], values: [] };
  }

  // Parse each entry as {name, value}, filter empty, sort descending
  const processedData = dataArray
    .map((dataEntry) => {
      const kabupateName = String((dataEntry && dataEntry[0]) || '').trim();
      const areaValue = Number((dataEntry && dataEntry[1]) || 0) || 0;
      return { kabupateName, areaValue };
    })
    .filter(({ kabupateName }) => kabupateName) // Remove entries without name
    .sort((entryA, entryB) => entryB.areaValue - entryA.areaValue); // Sort largest first

  return {
    labels: processedData.map((item) => item.kabupateName),
    values: processedData.map((item) => item.areaValue),
  };
};

// Check if item is valid as a data entry [name, value]
export const isValidDataEntry = (dataItem) => {
  return (
    Array.isArray(dataItem) &&
    dataItem.length >= 2 &&
    typeof dataItem[0] === 'string' &&
    !isNaN(Number(dataItem[1]))
  );
};
