import { useEffect, useMemo, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { TILE_SERVER_URL } from '../store/mapLayerStore.js';
import { useMapStore } from '../store/mapStore.js';
import { YEAR_CONFIG } from '../config/constants.js';

// Loading skeleton saat chart sedang fetch data
function LoadingChartSkeleton() {
  return (
    <div className="w-full h-full flex flex-col p-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
      </div>
      <div className="flex-1 flex items-end gap-2 px-2">
        {[55, 80, 65, 90, 45, 70, 60, 85, 50].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-t animate-pulse"
            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
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
  if (error) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
        <span className="text-red-400 text-sm font-bold">!</span>
      </div>
      <p className="text-xs font-semibold text-gray-600">Gagal memuat data</p>
      <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs">{error}</p>
    </div>
  );
  if (!serverResponse || !normalizedData) {
    console.warn('[CoverageChart] unable to normalize server response', serverResponse);
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-xs text-gray-400">Tidak ada data tersedia</p>
      </div>
    );
  }

  // ─── SUMMARY STAT ───
  const totalArea = chartValues.reduce((sum, v) => sum + v, 0);
  const totalAreaLabel = totalArea >= 1_000_000
    ? `${(totalArea / 1_000_000).toFixed(2)}M ha`
    : totalArea >= 1_000
    ? `${(totalArea / 1_000).toFixed(1)}K ha`
    : `${totalArea.toLocaleString()} ha`;

  // ─── ECHART OPTIONS ───
  const chartOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      backgroundColor: "#1e293b",
      borderColor: "transparent",
      textStyle: { color: "#f1f5f9", fontSize: 11 },
      formatter: (params) => {
        const p = params[0];
        return `<span style="font-weight:600">${p.name}</span><br/>` +
          `<span style="color:#5eead4">${Number(p.value).toLocaleString()} ha</span>`;
      },
    },
    grid: { left: 12, right: 16, top: 8, bottom: 48, containLabel: true },
    xAxis: {
      type: "category",
      data: chartLabels,
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      axisLabel: {
        rotate: 30,
        interval: 0,
        fontSize: 10,
        color: "#94a3b8",
        formatter: (label) => label.length > 10 ? label.slice(0, 9) + "…" : label,
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: {
        fontSize: 9,
        color: "#94a3b8",
        formatter: (v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}K` : v,
      },
    },
    series: [
      {
        name: "Area (ha)",
        type: "bar",
        data: chartValues,
        barMaxWidth: 36,
        itemStyle: {
          color: "#14b8a6",
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: "#2dd4bf",
          },
        },
      },
    ],
  };

  // ─── RENDER ───
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
        <div>
          <p className="text-xs font-bold text-gray-700 leading-tight">Area per Kabupaten</p>
          <p className="text-[10px] text-gray-400 mt-0.5">LULC Coverage · {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Total</p>
            <p className="text-sm font-black text-teal-600 leading-tight">{totalAreaLabel}</p>
          </div>
        </div>
      </div>
      {/* Chart */}
      <div className="flex-1 min-h-full relative overflow-hidden ">
        <div className="absolute inset-0" style={{ height: '100%', width: '100%' }}>
          <ReactECharts
            ref={echartsRef}
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            onChartReady={(instance) => {
              // Paksa resize setelah browser selesai hitung layout flex
              requestAnimationFrame(() => instance.resize());
            }}
          />
        </div>
      </div>
    </div>
  );
}
