import { memo, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { makeViewportTooltipPosition } from '../../utils/tooltipPosition.js';
import { CHART_STYLE, COLORS, TOOLTIP_STYLE } from '../../config/constants.js';
import { ChartHeader } from './chart-helpers.jsx';

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

  // Single-pass build: map + filter combined into one loop so we only iterate once
  const pieData = useMemo(() => {
    const result = [];
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const raw = row?.[label] ?? 0;
      const ha = (raw / 100) * totalHectares;
      if (ha <= 0) continue;
      result.push({
        name: label,
        value: ha,
        percent: raw,
        itemStyle: { color: colors[i] || '#94a3b8' },
      });
    }
    result.sort((a, b) => b.value - a.value);
    return result;
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
      confine: false,
      ...TOOLTIP_STYLE,
      position: makeViewportTooltipPosition(),
      formatter: (param) => {
        const marker = param.marker || '';
        const hectares = Number(param.value).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const percent = Number(param.percent).toFixed(1);
        return (
          `<div style="max-width:260px;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;line-height:1.5;">` +
          `<div style="font-weight:600;margin-bottom:4px;color:#f4f9f8;line-height:1.4;">Komposisi Tutupan Lahan</div>` +
          `${marker} <span style="font-weight:600;color:#f4f9f8;">${param.name}</span><br/>` +
          `<span style="color:${COLORS.PRIMARY};">${hectares} ha</span> · <span style="font-weight:600;color:#f4f9f8;">${percent}%</span>` +
          `</div>`
        );
      },
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 6,
      top: 'middle',
      tooltip: { show: false },
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
        legendHoverLink: false,
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        labelLine: { show: false },
        data: pieData,
      },
    ],
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden px-4 py-4">
      <ChartHeader
        title="Komposisi Tutupan Lahan"
        subtitle={`${row?.name || '—'} · ${year}`}
      />
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
          <div
            className="absolute pointer-events-none text-center"
            style={{ left: '35%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="text-[13px] font-bold leading-tight text-coffee-900">
              {totalLabel}
            </div>
            <div className="text-[9px] text-coffee-400 mt-0.5">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CompositionPieChart);
