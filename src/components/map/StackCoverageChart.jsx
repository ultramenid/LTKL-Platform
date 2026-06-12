import { memo, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import useSWR from 'swr';
import { PieChart } from 'lucide-react';
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

function useStackStats(kab, kec, des) {
  const yearFromStore = useMapStore((state) => state.year);
  const year = Number(yearFromStore) || YEAR_CONFIG.DEFAULT;

  const params = new URLSearchParams({ year });
  if (kab) params.set('kab', kab);
  if (kec) params.set('kec', kec);
  if (des) params.set('des', des);
  const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/stack-chart?${params.toString()}`;

  const { data, error, isLoading } = useSWR(statsUrl, fetchStackCoverageStats, {
    shouldRetryOnError: false,
  });

  return { data, error, isLoading, year };
}

// ─── PIE CHART (single row: desa drill-down) ───
function CompositionPieChart({ data, year }) {
  const echartsRef = useRef(null);

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

  const { rows, labels, colors } = data;
  const row = rows[0];
  const totalHectares = row?.total_ha ?? 0;

  const pieData = useMemo(() => {
    return labels
      .map((label, i) => {
        const raw = row?.[label] ?? 0;
        const ha = (raw / 100) * totalHectares;
        return {
          name: label,
          value: ha,
          percent: raw,
          itemStyle: { color: colors[i] || '#94a3b8' },
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [row, labels, colors, totalHectares]);

  const totalLabel =
    totalHectares >= 1_000_000
      ? `${(totalHectares / 1_000_000).toFixed(2)}M ha`
      : totalHectares >= 1_000
        ? `${(totalHectares / 1_000).toFixed(1)}K ha`
        : `${totalHectares.toLocaleString()} ha`;

  const option = {
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      extraCssText: 'z-index: 9999; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);',
      backgroundColor: '#1e293b',
      borderColor: 'transparent',
      textStyle: { color: '#f1f5f9', fontSize: 11, fontFamily: CHART_STYLE.FONT_SANS },
      formatter: (param) => {
        const marker = param.marker || '';
        const hectares = Number(param.value).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const percent = Number(param.percent).toFixed(1);
        return (
          `<div style="max-width:220px">` +
          `<div style="font-weight:600;margin-bottom:4px">Komposisi Tutupan Lahan</div>` +
          `${marker} <span style="font-weight:600">${param.name}</span><br/>` +
          `<span style="color:#94a3b8">${hectares} ha</span> · <span style="font-weight:600">${percent}%</span>` +
          `</div>`
        );
      },
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 6,
      top: 'middle',
      textStyle: { fontSize: 10, color: '#78716c', fontFamily: CHART_STYLE.FONT_SANS },
      itemWidth: 10,
      itemHeight: 10,
      icon: 'circle',
      pageIconColor: '#a8a29e',
      pageTextStyle: { color: '#a8a29e', fontSize: 10 },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: CHART_STYLE.FONT_SANS,
            color: '#1c1917',
          },
        },
        labelLine: { show: false },
        data: pieData,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: '26%',
        top: '46%',
        style: {
          text: totalLabel,
          textAlign: 'center',
          fill: '#1c1917',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: CHART_STYLE.FONT_SANS,
        },
      },
      {
        type: 'text',
        left: '30%',
        top: '53%',
        style: {
          text: 'Total',
          textAlign: 'center',
          fill: '#a8a29e',
          fontSize: 9,
          fontFamily: CHART_STYLE.FONT_SANS,
        },
      },
    ],
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden px-4 py-4">
      <ChartHeader
        title="Komposisi Tutupan Lahan"
        subtitle={`${row?.name || '—'} · ${year}`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
            <PieChart size={10} />
            Pie
          </span>
        </div>
      </ChartHeader>
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="absolute inset-0" style={{ height: '100%', width: '100%' }}>
          <ReactECharts
            ref={echartsRef}
            option={option}
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

// ─── STACKED BAR CHART (multiple rows) ───
function StackBarChart({ data, year, kab, kec }) {
  const echartsRef = useRef(null);

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
    if (!data || !Array.isArray(data.rows)) return null;
    const rows = data.rows;
    const labels = Array.isArray(data.labels) ? data.labels : [];
    const colors = Array.isArray(data.colors) ? data.colors : [];

    const names = rows.map((r) => r.name || '');
    const totalHectaresByRow = rows.map((r) => Number(r.total_ha) || 0);

    const series = labels.map((label, index) => {
      const color = colors[index] || '#94a3b8';
      return {
        name: label,
        type: 'bar',
        stack: 'total',
        barCategoryGap: '24%',
        emphasis: { focus: 'series' },
        itemStyle: { color },
        data: rows.map((r) => Number(r[label]) || 0),
      };
    });

    return { names, totalHectaresByRow, labels, colors, series };
  }, [data]);

  if (!chartData) return <ChartEmptyState />;

  const { names, totalHectaresByRow, series } = chartData;

  const subtitleParts = [];
  if (kab) subtitleParts.push(kab);
  if (kec) subtitleParts.push(kec);
  subtitleParts.push(`Komposisi · ${year}`);

  const option = {
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      extraCssText: 'z-index: 9999; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);',
      backgroundColor: '#1e293b',
      borderColor: 'transparent',
      textStyle: { color: '#f1f5f9', fontSize: 11, fontFamily: CHART_STYLE.FONT_SANS },
      formatter: (param) => {
        const rowIndex = param.dataIndex ?? 0;
        const totalHectares = totalHectaresByRow[rowIndex] ?? 0;
        const rowName = param.name ?? '';
        const percentValue = Number(param.value) || 0;
        const hectares = (percentValue / 100) * totalHectares;
        const marker = param.marker || '';

        return (
          `<div style="max-width:220px">` +
          `<div style="font-weight:700;margin-bottom:4px">${rowName}</div>` +
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
      data: names,
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
      <ChartHeader title="Komposisi Tutupan Lahan" subtitle={subtitleParts.join(' · ')} />
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="absolute inset-0" style={{ height: '100%', width: '100%' }}>
          <ReactECharts
            ref={echartsRef}
            option={option}
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

// ─── MAIN COMPONENT ───
function StackCoverageChart() {
  const kab = useMapStore((state) => state.breadcrumbs.kab ?? null);
  const kec = useMapStore((state) => state.breadcrumbs.kec ?? null);
  const des = useMapStore((state) => state.breadcrumbs.des ?? null);

  const { data: rawData, error, isLoading, year } = useStackStats(kab, kec, des);

  // Normalize old backend response (kabupaten array) → new format (rows array)
  const data = useMemo(() => {
    if (!rawData) return null;
    if (Array.isArray(rawData.rows)) return rawData;
    if (Array.isArray(rawData.kabupaten)) {
      return {
        ...rawData,
        level: 'kabupaten',
        rows: rawData.kabupaten.map((r) => ({ ...r, name: r.kabupaten })),
      };
    }
    return rawData;
  }, [rawData]);

  if (isLoading) return <LoadingChartSkeleton />;
  if (error) return <ChartErrorState message={error.message} />;
  if (!data || !Array.isArray(data.rows)) return <ChartEmptyState />;

  // Single row → pie chart (desa level)
  if (data.rows.length === 1) {
    return <CompositionPieChart data={data} year={year} />;
  }

  // Multiple rows → stacked bar
  return <StackBarChart data={data} year={year} kab={kab} kec={kec} />;
}

export default memo(StackCoverageChart);
