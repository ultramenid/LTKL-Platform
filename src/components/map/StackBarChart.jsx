import { memo, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { makeViewportTooltipPosition } from '../../utils/tooltipPosition.js';
import { CHART_STYLE, COLORS, TOOLTIP_STYLE } from '../../config/constants.js';
import { ChartHeader, ChartEmptyState } from './chart-helpers.jsx';

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
      confine: false,
      ...TOOLTIP_STYLE,
      position: makeViewportTooltipPosition(),
      formatter: (param) => {
        const rowIndex = param.dataIndex ?? 0;
        const totalHectares = totalHectaresByRow[rowIndex] ?? 0;
        const rowName = param.name ?? '';
        const percentValue = Number(param.value) || 0;
        const hectares = (percentValue / 100) * totalHectares;
        const marker = param.marker || '';

        return (
          `<div style="max-width:260px;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;line-height:1.5;">` +
          `<div style="font-weight:700;margin-bottom:4px;color:#f4f9f8;line-height:1.4;">${rowName}</div>` +
          `${marker} <span style="font-weight:600;color:#f4f9f8;">${param.seriesName}</span>: <span style="color:#f4f9f8;">${percentValue.toFixed(1)}% (${hectares.toLocaleString(undefined, { maximumFractionDigits: 0 })} ha)</span><br/>` +
          `<div style="margin-top:6px;border-top:1px solid ${COLORS.PRIMARY};padding-top:4px;font-size:10px;color:${COLORS.PRIMARY};line-height:1.4;">Total: ${totalHectares.toLocaleString(undefined, { maximumFractionDigits: 0 })} ha</div>` +
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
    <div className="w-full h-full flex flex-col overflow-hidden px-4 py-4 bg-white">
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

export default memo(StackBarChart);
