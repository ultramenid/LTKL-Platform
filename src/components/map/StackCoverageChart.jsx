import { memo, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import useSWR from 'swr';
import { useMapStore } from '../../store/mapStore.js';
import { API_ENDPOINTS, YEAR_CONFIG, CHART_STYLE } from '../../config/constants.js';
import {
  ChartHeader,
  LoadingChartSkeleton,
  ChartErrorState,
  ChartEmptyState,
} from './chart-helpers.jsx';

async function fetchStackCoverageStats(statsUrl) {
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

function StackCoverageChart({ kabupaten: kabupatenProp = null }) {
  const yearFromStore = useMapStore((state) => state.year);
  const year = Number(yearFromStore) || YEAR_CONFIG.DEFAULT;

  const echartsRef = useRef(null);
  const kabQuery = kabupatenProp ? `&kab=${encodeURIComponent(kabupatenProp)}` : '';
  const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/stack-chart?year=${year}${kabQuery}`;
  const {
    data: serverResponse,
    error,
    isLoading,
  } = useSWR(statsUrl, fetchStackCoverageStats, {
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

  const chartData = useMemo(() => {
    if (!serverResponse || !Array.isArray(serverResponse.kabupaten)) return null;

    const kabupatenRows = serverResponse.kabupaten;
    const labels = Array.isArray(serverResponse.labels) ? serverResponse.labels : [];
    const colors = Array.isArray(serverResponse.colors) ? serverResponse.colors : [];

    const kabupatenNames = kabupatenRows.map((row) => row.kabupaten || '');
    const totalHectaresByKabupaten = kabupatenRows.map((row) => Number(row.total_ha) || 0);

    const series = labels.map((label, index) => {
      const color = colors[index] || '#94a3b8';
      return {
        name: label,
        type: 'bar',
        stack: 'total',
        barCategoryGap: '24%',
        emphasis: { focus: 'series' },
        itemStyle: { color },
        data: kabupatenRows.map((row) => Number(row[label]) || 0),
      };
    });

    return { kabupatenNames, totalHectaresByKabupaten, labels, colors, series };
  }, [serverResponse]);

  if (isLoading) return <LoadingChartSkeleton />;
  if (error) return <ChartErrorState message={error.message} />;
  if (!chartData) return <ChartEmptyState />;

  const { kabupatenNames, totalHectaresByKabupaten, series } = chartData;

  const chartOption = {
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      extraCssText: 'z-index: 9999; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);',
      backgroundColor: '#1e293b',
      borderColor: 'transparent',
      textStyle: { color: '#f1f5f9', fontSize: 11, fontFamily: CHART_STYLE.FONT_SANS },
      formatter: (param) => {
        const kabupatenIndex = param.dataIndex ?? 0;
        const totalHectares = totalHectaresByKabupaten[kabupatenIndex] ?? 0;
        const kabupatenName = param.name ?? '';
        const percentValue = Number(param.value) || 0;
        const hectares = (percentValue / 100) * totalHectares;
        const marker = param.marker || '';

        return (
          `<div style="max-width:220px">` +
          `<div style="font-weight:700;margin-bottom:4px">${kabupatenName}</div>` +
          `${marker} <span style="font-weight:600">${param.seriesName}</span>: ${percentValue.toFixed(1)}% (${hectares.toLocaleString(undefined, { maximumFractionDigits: 0 })} ha)<br/>` +
          `<div style="margin-top:6px;border-top:1px solid #334155;padding-top:4px;font-size:10px;color:#94a3b8">Total: ${totalHectares.toLocaleString(undefined, { maximumFractionDigits: 0 })} ha</div>` +
          `</div>`
        );
      },
    },
    legend: { show: false },
    grid: { left: 40, right: 6, top: 8, bottom: 0, containLabel: false },
    xAxis: {
      type: 'category',
      data: kabupatenNames,
      axisLine: { show: true, lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { show: true, lineStyle: { color: '#f5f5f4', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        fontSize: 10,
        color: '#a8a29e',
        fontFamily: CHART_STYLE.FONT_SANS,
        formatter: '{value}%',
      },
    },
    series,
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden px-4 py-4">
      <ChartHeader title="Komposisi Tutupan Lahan" subtitle={`Per Kabupaten · ${year}`} />
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

export default memo(StackCoverageChart);
