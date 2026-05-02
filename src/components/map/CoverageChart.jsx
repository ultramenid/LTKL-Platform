import { useEffect, useMemo, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useMapStore } from '../../store/mapStore.js';
import { normalizeServerResponse, transformDataForChart } from '../../utils/dataTransform.js';
import { API_ENDPOINTS, YEAR_CONFIG, COLORS } from '../../config/constants.js';
import { getStatsSignal, abortStatsRequests } from '../../store/mapLayerStore.js';

// Skeleton loading so user still gets feedback while data loads
function LoadingChartSkeleton() {
  return (
    <div className="w-full h-full flex flex-col p-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
      </div>
      <div className="flex-1 flex items-end gap-2 px-2">
        {[55, 80, 65, 90, 45, 70, 60, 85, 50].map((heightPercent, index) => (
          <div
            key={index}
            className="flex-1 bg-gray-100 rounded-t animate-pulse"
            style={{ height: `${heightPercent}%`, animationDelay: `${index * 60}ms` }}
          />
        ))}
      </div>
      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

// Bar chart of area (ha) per kabupaten from LULC endpoint
export default function CoverageChart() {
  // ─── YEAR ───
  const yearFromStore = useMapStore((state) => state.year);
  const year = Number(yearFromStore) || YEAR_CONFIG.DEFAULT;

  // ─── STATE ───
  const [serverResponse, setServerResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const echartsRef = useRef(null);

  // ─── CLEANUP ECHARTS ───
  useEffect(() => {
    return () => {
      try {
        if (echartsRef.current) {
          echartsRef.current.getEchartsInstance?.()?.dispose?.();
        }
      } catch {
        // ignore echarts cleanup errors on unmount
      }
    };
  }, []);

  // ─── FETCH DATA ───
  // Uses statsController (separate from map layer controller) so map navigation
  // never aborts this fetch — only year change or component unmount cancels it
  useEffect(() => {
    let isComponentMounted = true;
    setLoading(true);
    setError(null);
    setServerResponse(null);

    const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/lulc-stats?year=${year}`;

    fetch(statsUrl, { signal: getStatsSignal() })
      .then(async (response) => {
        const responseText = await response.text();
        try {
          const parsedJson = JSON.parse(responseText);
          return {
            ok: response.ok,
            json: parsedJson,
            status: response.status,
            statusText: response.statusText,
            text: responseText,
          };
        } catch {
          return {
            ok: response.ok,
            json: null,
            status: response.status,
            statusText: response.statusText,
            text: responseText,
          };
        }
      })
      .then((response) => {
        if (!isComponentMounted) return;
        // Validasi HTTP status
        if (!response.ok) {
          setError(`Server ${response.status}: ${response.statusText} — ${response.text}`);
          setLoading(false);
          return;
        }
        // Validasi JSON
        if (!response.json) {
          setError(`Respons JSON dari server tidak valid. Isi respons: ${response.text}`);
          setLoading(false);
          return;
        }

        setServerResponse(response.json);
      })
      .catch((fetchError) => {
        // AbortError is expected when user switches year quickly — don't show as error
        if (fetchError.name === 'AbortError') return;
        if (!isComponentMounted) return;
        setError(String(fetchError));
      })
      .finally(() => {
        if (!isComponentMounted) return;
        setLoading(false);
      });

    return () => {
      isComponentMounted = false;
      // Abort in-flight fetch and create a fresh signal for the next run;
      // cleanup-based abort ensures map navigation never cancels this fetch
      abortStatsRequests();
    };
  }, [year]);

  // ─── NORMALIZE SERVER RESPONSE ───
  // Use utility from dataTransform.js to avoid duplicating logic
  const normalizedData = useMemo(
    () => normalizeServerResponse(serverResponse, year),
    [serverResponse, year],
  );

  // ─── TRANSFORM DATA FOR CHART ───
  const { labels: chartLabels, values: chartValues } = useMemo(() => {
    if (!normalizedData) return { labels: [], values: [] };
    return transformDataForChart(normalizedData.data);
  }, [normalizedData]);

  // ─── EARLY RETURNS (loading / error / empty) ───
  if (loading) return <LoadingChartSkeleton />;
  if (error)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-red-400 text-sm font-bold">!</span>
        </div>
        <p className="text-xs font-semibold text-gray-600">Gagal memuat data</p>
        <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs">{error}</p>
      </div>
    );
  if (!serverResponse || !normalizedData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-xs text-gray-400">Tidak ada data tersedia</p>
      </div>
    );
  }

  // ─── STATISTICS SUMMARY ───
  const totalArea = chartValues.reduce((total, areaValue) => total + areaValue, 0);
  const totalAreaLabel =
    totalArea >= 1_000_000
      ? `${(totalArea / 1_000_000).toFixed(2)}M ha`
      : totalArea >= 1_000
        ? `${(totalArea / 1_000).toFixed(1)}K ha`
        : `${totalArea.toLocaleString()} ha`;

  // ─── CHART OPTIONS ───
  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: '#1e293b',
      borderColor: 'transparent',
      textStyle: { color: '#f1f5f9', fontSize: 11 },
      formatter: (paramsList) => {
        const firstParam = paramsList[0];
        return (
          `<span style="font-weight:600">${firstParam.name}</span><br/>` +
          `<span style="color:#5eead4">${Number(firstParam.value).toLocaleString()} ha</span>`
        );
      },
    },
    grid: { left: 12, right: 16, top: 8, bottom: 48, containLabel: true },
    xAxis: {
      type: 'category',
      data: chartLabels,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: {
        rotate: 30,
        interval: 0,
        fontSize: 10,
        color: '#94a3b8',
        formatter: (label) => (label.length > 10 ? label.slice(0, 9) + '…' : label),
      },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: {
        fontSize: 9,
        color: '#94a3b8',
        formatter: (axisValue) =>
          axisValue >= 1_000_000
            ? `${(axisValue / 1_000_000).toFixed(1)}M`
            : axisValue >= 1_000
              ? `${(axisValue / 1_000).toFixed(0)}K`
              : axisValue,
      },
    },
    series: [
      {
        name: 'Area (ha)',
        type: 'bar',
        data: chartValues,
        barMaxWidth: 36,
        itemStyle: {
          color: COLORS.PRIMARY,
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#2dd4bf',
          },
        },
      },
    ],
  };

  // ─── RENDER ───
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Judul ringkas */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
        <div>
          <p className="text-xs font-bold text-gray-700 leading-tight">Area per Kabupaten</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Cakupan LULC · {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Total</p>
            <p className="text-sm font-black text-teal-600 leading-tight">{totalAreaLabel}</p>
          </div>
        </div>
      </div>
      {/* Grafik */}
      <div className="flex-1 min-h-full relative overflow-hidden ">
        <div className="absolute inset-0" style={{ height: '100%', width: '100%' }}>
          <ReactECharts
            ref={echartsRef}
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            onChartReady={(instance) => {
              // Force resize after browser finishes calculating flex layout
              requestAnimationFrame(() => instance.resize());
            }}
          />
        </div>
      </div>
    </div>
  );
}
