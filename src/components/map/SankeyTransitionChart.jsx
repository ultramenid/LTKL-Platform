import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import useSWR from 'swr';
import { X, Maximize2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import { makeViewportTooltipPosition } from '../../utils/tooltipPosition.js';
import { API_ENDPOINTS, COLORS, makeTooltipOption } from '../../config/constants.js';
import SankeyYearSelector from './SankeyYearSelector.jsx';
import {
  ChartHeader,
  SankeyLoadingSkeleton,
  ChartErrorState,
  ChartEmptyState,
} from './chart-helpers.jsx';

async function fetchSankeyTransition(url) {
  const response = await fetch(url);
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

function buildEdgeTooltipHtml(
  { source, target, value, originalValue, details = {} },
  { nodeColorMap, startYear, endYear, detailsLabel, isCompact },
) {
  const actualValue = originalValue ?? value;
  const cleanSource = (source || '').replace(/\s*\(\d{4}\)\s*$/, '');
  const cleanTarget = (target || '').replace(/\s*\(\d{4}\)\s*$/, '');
  const sourceColor = nodeColorMap[source] || '#94a3b8';
  const targetColor = nodeColorMap[target] || '#94a3b8';
  const accentMuted = 'rgba(20, 184, 166, 0.65)';

  const padding = isCompact ? '8px 12px' : '10px 14px';
  const titleSize = isCompact ? '12px' : '14px';
  const textSize = isCompact ? '11px' : '13px';
  const dotSize = isCompact ? '10px' : '12px';
  const rowPaddingV = isCompact ? '3px' : '4px';
  const rowPaddingH = isCompact ? '6px' : '8px';
  const rowFont = isCompact ? '10px' : '12px';
  const pctFont = isCompact ? '10px' : '11px';
  const minWidth = isCompact ? '260px' : '300px';

  let detailRows = '';
  const detailEntries = Object.entries(details).sort(([, a], [, b]) => b - a);
  if (detailsLabel && detailEntries.length > 0) {
    detailRows = detailEntries
      .map(([name, ha]) => {
        const pct = ((Number(ha) / Number(actualValue)) * 100).toFixed(1);
        return (
          `<tr>` +
          `<td style="padding:${rowPaddingV} ${rowPaddingH} ${rowPaddingV} 0;color:${accentMuted};font-size:${rowFont};line-height:1.5;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">${name}</td>` +
          `<td style="padding:${rowPaddingV} 0 ${rowPaddingV} ${rowPaddingH};text-align:right;color:#f4f9f8;font-size:${rowFont};line-height:1.5;font-weight:500;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">${Number(ha).toLocaleString(undefined, { maximumFractionDigits: 0 })} ha</td>` +
          `<td style="padding:${rowPaddingV} 0 ${rowPaddingV} ${rowPaddingH};text-align:right;color:${accentMuted};font-size:${pctFont};line-height:1.5;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">${pct}%</td>` +
          `</tr>`
        );
      })
      .join('');
    detailRows = `<table style="width:100%;border-collapse:collapse;margin-top:8px;border-top:1px solid ${COLORS.PRIMARY};padding-top:6px;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">${detailRows}</table>`;
  }

  return (
    `<div style="padding:${padding};min-width:${minWidth};max-width:min(90vw,500px);word-break:break-word;overflow-wrap:anywhere;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;line-height:1.5;">` +
    `<div style="font-size:${titleSize};font-weight:700;color:#f4f9f8;margin-bottom:6px;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">${startYear} - ${endYear}</div>` +
    `<div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">` +
    `<span style="display:inline-block;width:${dotSize};height:${dotSize};border-radius:50%;background:${sourceColor};flex-shrink:0;"></span>` +
    `<span style="font-size:${textSize};color:#f4f9f8;font-weight:500;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;white-space:nowrap;">${cleanSource}</span>` +
    `<span style="font-size:${textSize};color:${accentMuted};line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">→</span>` +
    `<span style="display:inline-block;width:${dotSize};height:${dotSize};border-radius:50%;background:${targetColor};flex-shrink:0;"></span>` +
    `<span style="font-size:${textSize};color:#f4f9f8;font-weight:500;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;white-space:nowrap;">${cleanTarget}</span>` +
    `<span style="font-size:${textSize};color:#f4f9f8;font-weight:700;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;white-space:nowrap;">: ${Number(actualValue).toLocaleString(undefined, { maximumFractionDigits: 0 })} ha</span>` +
    `</div>` +
    detailRows +
    `</div>`
  );
}

function buildNodeTooltipHtml(name, { nodeColorMap, isCompact }) {
  const cleanName = name.replace(/\s*\(\d{4}\)\s*$/, '');
  const yearMatch = name.match(/\((\d{4})\)$/);
  const year = yearMatch ? yearMatch[1] : '';
  const color = nodeColorMap[name] || '#94a3b8';
  const padding = isCompact ? '8px 12px' : '10px 14px';
  const titleSize = isCompact ? '12px' : '14px';
  const textSize = isCompact ? '11px' : '13px';
  const dotSize = isCompact ? '10px' : '12px';
  const minWidth = isCompact ? '160px' : '180px';

  return (
    `<div style="padding:${padding};min-width:${minWidth};max-width:min(90vw,240px);word-break:break-word;overflow-wrap:anywhere;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;line-height:1.5;">` +
    `<div style="font-size:${titleSize};font-weight:700;color:#f4f9f8;margin-bottom:4px;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">${year}</div>` +
    `<div style="display:flex;align-items:center;gap:6px;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">` +
    `<span style="display:inline-block;width:${dotSize};height:${dotSize};border-radius:50%;background:${color};flex-shrink:0;"></span>` +
    `<span style="font-size:${textSize};color:#f4f9f8;font-weight:500;line-height:1.4;font-family:'Schibsted Grotesk',ui-sans-serif,sans-serif;">${cleanName}</span>` +
    `</div>` +
    `</div>`
  );
}

function makeChartOption(nodes, links, nodeColorMap, startYear, endYear, detailsLabel, isCompact, appendToBody = true) {
  return {
    tooltip: {
      trigger: 'item',
      appendToBody,
      confine: false,
      ...makeTooltipOption({
        textStyle: {
          fontSize: isCompact ? 11 : 12,
        },
      }),
      extraCssText:
        makeTooltipOption().extraCssText +
        ' max-width: min(90vw, 500px); max-height: calc(100vh - 16px); overflow-y: auto;',
      position: makeViewportTooltipPosition(),
      formatter: (params) => {
        if (params.dataType === 'node') {
          return buildNodeTooltipHtml(params.name, { nodeColorMap, isCompact });
        }
        if (params.dataType === 'edge') {
          return buildEdgeTooltipHtml(params.data, {
            nodeColorMap,
            startYear,
            endYear,
            detailsLabel,
            isCompact,
          });
        }
        return params.name;
      },
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        top: isCompact ? 6 : 0,
        bottom: isCompact ? 0 : 16,
        left: isCompact ? 8 : 24,
        right: isCompact ? 8 : 24,
        nodeWidth: isCompact ? 22 : 28,
        nodeGap: isCompact ? 4 : 0,
        nodeAlign: 'justify',
        layoutIterations: 128,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { opacity: 0.7 },
        },
        label: { show: false },
        lineStyle: {
          color: 'source',
          opacity: 0.28,
          curveness: 0.45,
        },
        itemStyle: {
          borderWidth: 0,
        },
        data: nodes,
        links: links,
      },
    ],
  };
}

function SankeyTransitionChart({
  kabupaten: kabupatenProp = null,
  kec: kecProp = null,
  des: desProp = null,
}) {
  const echartsRef = useRef(null);
  const modalEchartsRef = useRef(null);
  const dialogRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { startYear, endYear } = useMapStore(
    useShallow((state) => ({
      startYear: state.sankeyStartYear,
      endYear: state.sankeyEndYear,
    })),
  );

  const params = new URLSearchParams({ startYear, endYear });
  if (kabupatenProp) params.set('kab', kabupatenProp);
  if (kecProp) params.set('kec', kecProp);
  if (desProp) params.set('des', desProp);
  const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/sankey-transition?${params.toString()}`;
  const {
    data: serverResponse,
    error,
    isLoading,
  } = useSWR(statsUrl, fetchSankeyTransition, {
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

  // Open dialog modally when React renders it; close it before unmount.
  // Using conditional rendering (isModalOpen in JSX) satisfies the
  // "rerender-state-only-in-handlers" rule while still leveraging
  // native <dialog> focus trapping and Escape-to-close.
  useEffect(() => {
    if (!isModalOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    el.showModal();

    const instance = modalEchartsRef.current?.getEchartsInstance?.();
    if (instance) {
      requestAnimationFrame(() => instance.resize());
    }

    return () => {
      el.close();
    };
  }, [isModalOpen]);

  const chartData = useMemo(() => {
    if (!serverResponse) return null;
    if (!Array.isArray(serverResponse.nodes) || !Array.isArray(serverResponse.links)) return null;

    const nodeColorMap = {};
    serverResponse.nodes.forEach((node) => {
      nodeColorMap[node.name] = node.itemStyle?.color || '#94a3b8';
    });

    // ECharts sizes each Sankey node by Math.max(inflow, outflow, node.value).
    // Pass the real per-node flow so node heights stay proportional to area
    // (matches the reference: large forest block + tiny slivers for minor classes).
    const inflowByNode = {};
    const outflowByNode = {};
    serverResponse.links.forEach((link) => {
      outflowByNode[link.source] = (outflowByNode[link.source] || 0) + link.value;
      inflowByNode[link.target] = (inflowByNode[link.target] || 0) + link.value;
    });

    const nodes = serverResponse.nodes.map((node) => {
      const flow = Math.max(inflowByNode[node.name] || 0, outflowByNode[node.name] || 0);
      return {
        ...node,
        value: flow > 0 ? flow : 0.0001,
        itemStyle: node.itemStyle || {},
        label: { show: false },
      };
    });

    // Single-pass build: combine filter + map into one loop
    const links = [];
    for (const link of serverResponse.links) {
      if (link.value <= 0) continue;
      links.push({
        source: link.source,
        target: link.target,
        value: link.value,
        details: link.details || {},
      });
    }

    return {
      nodes,
      links,
      nodeColorMap,
      startYear,
      endYear,
      level: serverResponse.level || 'kabupaten',
      detailsLabel: serverResponse.detailsLabel || null,
    };
  }, [serverResponse, startYear, endYear]);

  const chartOption = useMemo(
    () =>
      makeChartOption(
        chartData?.nodes,
        chartData?.links,
        chartData?.nodeColorMap,
        chartData?.startYear,
        chartData?.endYear,
        chartData?.detailsLabel,
        true,
      ),
    [chartData],
  );

  const modalOption = useMemo(
    () =>
      makeChartOption(
        chartData?.nodes,
        chartData?.links,
        chartData?.nodeColorMap,
        chartData?.startYear,
        chartData?.endYear,
        chartData?.detailsLabel,
        false,
        false, // keep tooltip inside the dialog container so it stays in the top layer
      ),
    [chartData],
  );

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  useEffect(() => {
    const instance = echartsRef.current?.getEchartsInstance?.();
    if (instance) {
      requestAnimationFrame(() => instance.resize());
    }
  }, [chartOption]);



  if (isLoading) return <SankeyLoadingSkeleton />;
  if (error) return <ChartErrorState message={error.message} />;
  if (!chartData) return <ChartEmptyState />;

  return (
    <>
      <div className="w-full h-full flex flex-col overflow-hidden px-4 py-4">
        <div className="shrink-0">
          <ChartHeader
            title="Transisi Tutupan Lahan"
            subtitle="Perubahan tutupan lahan antar tahun"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <SankeyYearSelector />
              <button
                type="button"
                onClick={openModal}
                className="p-1 rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                title="Perbesar"
                aria-label="Perbesar chart"
              >
                <Maximize2 size={14} className="text-primary/80" />
              </button>
            </div>
          </ChartHeader>
        </div>
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

      {/* Native <dialog> gives focus trapping, Escape-to-close, and ::backdrop for free.
          Conditional rendering keeps isModalOpen in JSX so React Doctor's
          rerender-state-only-in-handlers rule is satisfied. */}
      {isModalOpen && (
        <dialog
          ref={dialogRef}
          className="w-[92vw] h-[88vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden p-0 m-auto backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-in open:fade-in-0 open:zoom-in-95"
          onClose={closeModal}
          aria-label="Transisi Tutupan Lahan — Tampilan Penuh"
        >
          <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-coffee-900/10">
              <div>
                <p className="text-sm font-bold text-coffee-900">Transisi Tutupan Lahan</p>
                <p className="text-xs text-coffee-400 mt-0.5">
                  {startYear} → {endYear}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X size={18} className="text-primary/80" />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden p-2">
              <div className="absolute inset-0" style={{ height: '100%', width: '100%' }}>
                <ReactECharts
                  ref={modalEchartsRef}
                  option={modalOption}
                  notMerge={true}
                  lazyUpdate={true}
                  style={{ height: '100%', width: '100%' }}
                  onChartReady={(instance) => {
                    requestAnimationFrame(() => instance.resize());
                  }}
                />
              </div>
            </div>

            <div className="shrink-0 px-5 py-2 border-t border-coffee-900/10 bg-parchment-50">
              <p className="text-[10px] text-coffee-400">
                {chartData?.detailsLabel
                  ? `Hover node atau link untuk melihat detail transisi per ${chartData.detailsLabel.toLowerCase()} · Tekan Escape untuk menutup`
                  : 'Hover node atau link untuk melihat detail transisi · Tekan Escape untuk menutup'}
              </p>
            </div>
          </dialog>
        )}
    </>
  );
}

export default memo(SankeyTransitionChart);
