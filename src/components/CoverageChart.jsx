import { useEffect, useMemo, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { TILE_SERVER_URL } from '../store/mapLayerStore.js';
import { useMapStore } from '../store/mapStore.js';
import { YEAR_CONFIG } from '../config/constants.js';

// Loading skeleton saat chart sedang fetch data
function LoadingChartSkeleton() {
  return (
    <div className="w-full h-full p-4">
      <div className="w-full h-full bg-gray-200 animate-pulse rounded"></div>
    </div>
  );
}

// Chart komponen: tampilkan area (ha) per kabupaten dari LULC server
// Data fetched dari: /lulc-stats?year=XXXX
// Chart: bar chart area per kabupaten, sorted descending
export default function CoverageChartDebug() {
  // ─── GET YEAR ───
  // Ambil tahun dari Zustand store dengan fallback ke YEAR_CONFIG.DEFAULT
  const yearFromStore = useMapStore ? useMapStore((s) => s.year) : undefined;
  const year = Number(yearFromStore) || YEAR_CONFIG.DEFAULT;

  // ─── STATE ───
  const [serverResponse, setServerResponse] = useState(null); // Raw response dari server
  const [error, setError] = useState(null); // Error message
  const [loading, setLoading] = useState(true); // Loading state
  const echartsRef = useRef(null); // Reference ke React ECharts instance

  // ─── CLEANUP ECHARTS ───
  // Dispose echarts instance saat component unmount
  useEffect(() => {
    return () => {
      try {
        if (echartsRef.current) {
          echartsRef.current.getEchartsInstance?.()?.dispose?.();
        }
      } catch (e) {
        // Abaikan error cleanup echarts
      }
    };
  }, []);

  // ─── FETCH DATA ───
  // Fetch LULC statistics dari tile server setiap kali tahun berubah
  useEffect(() => {
    let isComponentMounted = true; // Track component mount status (untuk cleanup)
    setLoading(true);
    setError(null);
    setServerResponse(null);

    const statsUrl = `${TILE_SERVER_URL}/lulc-stats?year=${year}`;
    console.debug('[CoverageChart] fetching', statsUrl);

    fetch(statsUrl)
      .then(async (response) => {
        // Parse response text → coba JSON, simpan raw text untuk debugging
        const responseText = await response.text();
        try {
          const parsedJson = JSON.parse(responseText);
          return { 
            ok: response.ok, 
            json: parsedJson, 
            status: response.status, 
            statusText: response.statusText, 
            text: responseText 
          };
        } catch (parseError) {
          // JSON parse gagal, return raw text
          return { 
            ok: response.ok, 
            json: null, 
            status: response.status, 
            statusText: response.statusText, 
            text: responseText 
          };
        }
      })
      .then((response) => {
        if (!isComponentMounted) return;
        console.debug('[CoverageChart] fetch response:', response);
        
        // Check HTTP status
        if (!response.ok) {
          setError(`Server ${response.status}: ${response.statusText} — ${response.text}`);
          setLoading(false);
          return;
        }
        
        // Check JSON parse
        if (!response.json) {
          setError(`Invalid JSON from server. Response text: ${response.text}`);
          setLoading(false);
          return;
        }
        
        // Success: set response
        setServerResponse(response.json);
      })
      .catch((fetchError) => {
        if (!isComponentMounted) return;
        console.error('[CoverageChart] fetch error', fetchError);
        setError(String(fetchError));
      })
      .finally(() => {
        if (!isComponentMounted) return;
        setLoading(false);
      });

    // Cleanup: mark component as unmounted saat effect cleanup
    return () => {
      isComponentMounted = false;
    };
  }, [year]);

  // ─── NORMALIZE SERVER RESPONSE ───
  // Backend bisa return berbagai format:
  // 1. { year: N, data: [...] } 
  // 2. { "2024": [...], "2025": [...] }
  // 3. Array langsung [...]
  // Normalize ke: { year: number, data: Array<[kabupaten, area]> }
  const normalizedData = useMemo(() => {
    if (!serverResponse) return null;

    // Format 1: Already normalized { year: N, data: [...] }
    if (serverResponse && serverResponse.year && Array.isArray(serverResponse.data)) {
      return { year: Number(serverResponse.year), data: serverResponse.data };
    }

    // Format 2: Object berkey numerik => ambil value array
    const responseKeys = Object.keys(serverResponse);
    for (const yearKey of responseKeys) {
      // Match tahun YYYY
      if (/^\d{4}$/.test(yearKey) && Array.isArray(serverResponse[yearKey])) {
        return { year: Number(yearKey), data: serverResponse[yearKey] };
      }
    }

    // Format 3: Array langsung
    if (Array.isArray(serverResponse)) {
      return { year, data: serverResponse };
    }

    // Format 4: Cari array value pertama (last resort)
    for (const yearKey of responseKeys) {
      if (Array.isArray(serverResponse[yearKey])) {
        return { 
          year: serverResponse.year ? Number(serverResponse.year) : Number(yearKey) || year, 
          data: serverResponse[yearKey] 
        };
      }
    }

    // Tidak ada format yang cocok
    return null;
  }, [serverResponse, year]);

  // ─── TRANSFORM DATA FOR CHART ───
  // Transform data ke labels (kabupaten) & values (area)
  // Sort descending by area
  const { chartLabels, chartValues } = useMemo(() => {
    if (!normalizedData) return { chartLabels: [], chartValues: [] };
    
    const transformedEntries = normalizedData.data
      .map((entry) => {
        const kabupatenName = String((entry && entry[0]) || '');
        const areaHectare = Number((entry && entry[1]) || 0) || 0;
        return { kabupatenName, areaHectare };
      })
      .filter((item) => item.kabupatenName) // Buang entry tanpa nama kabupaten
      .sort((item1, item2) => item2.areaHectare - item1.areaHectare);
    
    return { 
      chartLabels: transformedEntries.map((item) => item.kabupatenName), 
      chartValues: transformedEntries.map((item) => item.areaHectare) 
    };
  }, [normalizedData]);

  // ─── RENDER ERROR STATES ───
  if (loading) return <LoadingChartSkeleton />;
  if (error) return <div style={{ color: 'crimson' }}>Error loading chart: {error}</div>;
  if (!serverResponse) {
    return (
      <div>
        No data received. Open console (F12) → Network tab and check the response from <code>{TILE_SERVER_URL}/lulc-stats</code>.
      </div>
    );
  }
  if (!normalizedData) {
    console.warn('[CoverageChart] unable to normalize server response', serverResponse);
    return (
      <div>
        Unexpected server response shape. Open console (F12) and check the <code>serverResponse</code> object logged above.
      </div>
    );
  }

  // ─── ECHART OPTIONS ───
  // Setup bar chart dengan ECharts
  const chartOption = {
    title: {
      text: `Area (ha) per Kabupaten — ${year}`,
      left: "center",
      textStyle: { 
        fontSize: 17,
        color: "#0e7490",
      }
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const param = params[0];
        return `${param.name}<br/>Area: ${Number(param.value).toLocaleString()} ha`;
      }
    },
    grid: { left: "10%", right: "10%", bottom: "18%" },
    xAxis: {
      type: "category",
      data: chartLabels,
      axisLabel: { 
        rotate: 30, 
        interval: 0, 
        formatter: (label) => label.length > 18 ? label.slice(0, 16) + "…" : label 
      }
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Area (ha)",
        type: "bar",
        data: chartValues,
        barWidth: "50%",
        itemStyle: {
          color: '#06b6d4'
        }
      }
    ],
  };

  // ─── RENDER ───
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts ref={echartsRef} option={chartOption} style={{ height: '100%' }} />
    </div>
  );
}
