import { memo, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import useSWR from 'swr';
import { useMapStore } from '../../store/mapStore.js';
import { normalizeServerResponse, transformDataForChart } from '../../utils/dataTransform.js';
import { API_ENDPOINTS, YEAR_CONFIG, COLORS } from '../../config/constants.js';

async function fetchCoverageStats(statsUrl) {
  const response = await fetch(statsUrl);
  const responseText = await response.text();
  let parsedJson = null;

  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    if (response.ok) {
      throw new Error(`Respons JSON dari server tidak valid. Isi respons: ${responseText}`);
    }
  }

  if (!response.ok) {
    throw new Error(`Server ${response.status}: ${response.statusText} — ${responseText}`);
  }
  if (!parsedJson) {
    throw new Error(`Respons JSON dari server tidak valid. Isi respons: ${responseText}`);
  }

  return parsedJson;
}

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

function CoverageChart() {
  const yearFromStore = useMapStore((state) => state.year);
  const year = Number(yearFromStore) || YEAR_CONFIG.DEFAULT;

  const echartsRef = useRef(null);
  const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/lulc-stats?year=${year}`;
  const {
    data: serverResponse,
    error,
    isLoading,
  } = useSWR(statsUrl, fetchCoverageStats, {
    shouldRetryOnError: false,
  });

  useEffect(() => {
    const currentEchartsRef = echartsRef.current;
    return () => {
      try {
        if (currentEchartsRef) {
          currentEchartsRef.getEchartsInstance?.()?.dispose?.();
        }
      } catch {
        void 0;
      }
    };
  }, []);

  const normalizedData = useMemo(
    () => normalizeServerResponse(serverResponse, year),
    [serverResponse, year],
  );

  const { labels: chartLabels, values: chartValues } = useMemo(() => {
    if (!normalizedData) return { labels: [], values: [] };
    return transformDataForChart(normalizedData.data);
  }, [normalizedData]);

  if (isLoading) return <LoadingChartSkeleton />;
  if (error)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-red-400 text-sm font-bold">!</span>
        </div>
        <p className="text-xs font-semibold text-gray-600">Gagal memuat data</p>
        <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs">{error.message}</p>
      </div>
    );
  if (!serverResponse || !normalizedData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-xs text-gray-400">Tidak ada data tersedia</p>
      </div>
    );
  }

  const totalArea = chartValues.reduce((total, areaValue) => total + areaValue, 0);
  const totalAreaLabel =
    totalArea >= 1_000_000
      ? `${(totalArea / 1_000_000).toFixed(2)}M ha`
      : totalArea >= 1_000
        ? `${(totalArea / 1_000).toFixed(1)}K ha`
        : `${totalArea.toLocaleString()} ha`;

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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
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
      <div className="flex-1 min-h-full relative overflow-hidden ">
        <div className="absolute inset-0" style={{ height: '100%', width: '100%' }}>
          <ReactECharts
            ref={echartsRef}
            option={chartOption}
            notMerge={true}
            lazyUpdate={true}
            style={{ height: '100%', width: '100%' }}
            onChartReady={(instance) => {
              requestAnimationFrame(() => instance.resize());
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(CoverageChart);
