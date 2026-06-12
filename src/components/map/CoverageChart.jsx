import { memo, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import useSWR from 'swr';
import { useMapStore } from '../../store/mapStore.js';
import { normalizeServerResponse, transformDataForChart } from '../../utils/dataTransform.js';
import { makeViewportTooltipPosition } from '../../utils/tooltipPosition.js';
import { API_ENDPOINTS, YEAR_CONFIG, COLORS, CHART_STYLE, TOOLTIP_STYLE } from '../../config/constants.js';
import {
  ChartHeader,
  LoadingChartSkeleton,
  ChartErrorState,
  ChartEmptyState,
} from './chart-helpers.jsx';

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
  if (error) return <ChartErrorState message={error.message} />;
  if (!serverResponse || !normalizedData) {
    return <ChartEmptyState />;
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
      trigger: 'item',
      appendToBody: true,
      confine: false,
      ...TOOLTIP_STYLE,
      position: makeViewportTooltipPosition(),
      formatter: (param) => {
        return (
          `<div style="font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;line-height:1.5;">` +
          `<span style="font-weight:600;color:#f4f9f8;line-height:1.4;">${param.name}</span><br/>` +
          `<span style="color:${COLORS.PRIMARY};line-height:1.4;">${Number(param.value).toLocaleString()} ha</span>` +
          `</div>`
        );
      },
    },
    grid: { left: 48, right: 6, top: 8, bottom: 0, containLabel: false },
    xAxis: {
      type: 'category',
      data: chartLabels,
      axisLine: { show: true, lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { show: true, lineStyle: { color: '#f5f5f4', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        fontSize: 10,
        color: '#a8a29e',
        fontFamily: CHART_STYLE.FONT_SANS,
        formatter: (value) =>
          value >= 1_000_000
            ? `${(value / 1_000_000).toFixed(1)}M`
            : value >= 1_000
              ? `${(value / 1_000).toFixed(0)}K`
              : value,
      },
    },
    series: [
      {
        name: 'Area (ha)',
        type: 'bar',
        data: chartValues,
        barMaxWidth: 36,
        barCategoryGap: '8%',
        itemStyle: {
          color: COLORS.FOREST,
        },
        emphasis: {
          itemStyle: {
            color: COLORS.FOREST_HOVER,
          },
        },
      },
    ],
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden px-4 py-4">
      <ChartHeader title="Area per Kabupaten" subtitle={`Cakupan LULC · ${year}`}>
        <div className="text-right shrink-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-stone-400">
            Total
          </p>
          <p
            className="mt-0.5 text-[15px] font-semibold leading-tight"
            style={{ color: COLORS.FOREST }}
          >
            {totalAreaLabel}
          </p>
        </div>
      </ChartHeader>
      <div className="flex-1 min-h-0 relative overflow-hidden">
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
