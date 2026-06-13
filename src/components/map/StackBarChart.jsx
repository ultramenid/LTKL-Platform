import { memo, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { makeViewportTooltipPosition } from '../../utils/tooltipPosition.js';
import { CHART_STYLE, COLORS, TOOLTIP_STYLE } from '../../config/constants.js';
import { ChartHeader, ChartEmptyState } from './chart-helpers.jsx';

function StackBarChart({ data, kab, kec, des }) {
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
    const rows = data.rows; // already year-ordered by the backend
    const labels = Array.isArray(data.labels) ? data.labels : [];
    const colors = Array.isArray(data.colors) ? data.colors : [];

    const names = rows.map((r) => r.name || String(r.year ?? ''));
    const totalHectaresByRow = rows.map((r) => Number(r.total_ha) || 0);

    // Order segments by total magnitude across all years so the biggest class
    // (e.g. hutan) sits at the bottom of every stack and smaller classes stack
    // above in descending order. ECharts draws series[0] at the stack bottom.
    const labelTotals = labels.map((label) =>
      rows.reduce((sum, r) => sum + (Number(r[label]) || 0), 0),
    );
    const orderedIndexes = labels
      .map((_, index) => index)
      .sort((a, b) => labelTotals[b] - labelTotals[a]);

    const series = orderedIndexes.map((index) => {
      const label = labels[index];
      const color = colors[index] || '#94a3b8';
      return {
        name: label,
        type: 'bar',
        stack: 'total',
        barCategoryGap: '15%',
        emphasis: { focus: 'series' },
        itemStyle: { color },
        data: rows.map((r) => Number(r[label]) || 0),
      };
    });

    return { names, totalHectaresByRow, series };
  }, [data]);

  // Build the full ECharts option in a memo and feed it to a single persistent
  // instance (no key-remount). ECharts then animates the option natively — a
  // grow-from-baseline on first mount, a morph on drill/range change — which is
  // the same proven path the Sankey chart uses and animates reliably even on a
  // cold cache-hydrated page refresh.
  const chartOption = useMemo(() => {
    if (!chartData || chartData.names.length === 0) return null;
    const { names, totalHectaresByRow, series } = chartData;

    return {
      animationDuration: 700,
      animationEasing: 'cubicOut',
      // Stagger the bars left-to-right by year so the entrance reads as a wipe.
      animationDelay: (index) => index * 14,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        appendToBody: true,
        confine: false,
        ...TOOLTIP_STYLE,
        position: makeViewportTooltipPosition(),
        // Show the full land-cover breakdown for the hovered year: every class
        // with its color, absolute hectares, and name, sorted largest first.
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const year = params[0].axisValueLabel ?? params[0].name ?? '';
          const dataIndex = params[0].dataIndex ?? 0;
          const totalHectares = totalHectaresByRow[dataIndex] ?? 0;

          const cells = params
            .map((p) => ({ name: p.seriesName, value: Number(p.value) || 0, color: p.color }))
            .sort((a, b) => b.value - a.value)
            .map((item) => {
              const hectaresText =
                item.value > 0
                  ? `${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ha`
                  : '-';
              return (
                `<div style="display:flex;gap:6px;align-items:flex-start;min-width:0;">` +
                `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};flex-shrink:0;margin-top:3px;"></span>` +
                `<div style="min-width:0;">` +
                `<div style="font-weight:700;color:#f4f9f8;font-size:12px;line-height:1.3;">${hectaresText}</div>` +
                `<div style="color:rgba(244,249,248,0.6);font-size:10px;line-height:1.3;">${item.name}</div>` +
                `</div></div>`
              );
            })
            .join('');

          return (
            `<div style="font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;max-width:min(86vw,380px);">` +
            `<div style="font-weight:700;color:#f4f9f8;font-size:13px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:6px;">${year}</div>` +
            `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;">${cells}</div>` +
            `<div style="margin-top:8px;border-top:1px solid ${COLORS.PRIMARY};padding-top:5px;font-size:10px;color:${COLORS.PRIMARY};">Total: ${totalHectares.toLocaleString(undefined, { maximumFractionDigits: 0 })} ha</div>` +
            `</div>`
          );
        },
      },
      legend: { show: false },
      grid: { left: 44, right: 6, top: 8, bottom: 18, containLabel: false },
      xAxis: {
        type: 'category',
        data: names,
        axisLine: { show: true, lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          fontSize: 9,
          color: '#a8a29e',
          fontFamily: CHART_STYLE.FONT_SANS,
          // Show every 5th year plus the first/last so the axis stays readable.
          interval: (index) => {
            const year = Number(names[index]);
            return year % 5 === 0 || index === 0 || index === names.length - 1;
          },
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
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
      series,
    };
  }, [chartData]);

  // Keep the instance sized to its container after every option change — mirrors
  // the Sankey chart so the first paint lands at full size and the animation runs.
  useEffect(() => {
    const instance = echartsRef.current?.getEchartsInstance?.();
    if (instance) {
      requestAnimationFrame(() => instance.resize());
    }
  }, [chartOption]);

  if (!chartData || chartData.names.length === 0) return <ChartEmptyState />;

  const { names } = chartData;

  // Breadcrumb-style scope path so parent levels stay visible, not just the
  // current one (e.g. "Kapuas Hulu › Embaloh Hulu › Nanga Nyabau").
  const scopeParts = [kab, kec, des].filter(Boolean);
  const scopeLabel = scopeParts.length > 0 ? scopeParts.join(' › ') : 'Semua Kabupaten';
  const rangeLabel = names.length > 1 ? `${names[0]}–${names[names.length - 1]}` : names[0];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden px-4 py-4 bg-white">
      <ChartHeader
        title="Komposisi Tutupan Lahan"
        subtitle={`${scopeLabel} · Komposisi ${rangeLabel}`}
      />
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

export default memo(StackBarChart);
