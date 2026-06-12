import { useCallback, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { sankey } from 'd3-sankey';
import SUPPLY_CHAIN_DATA from '../../data/supplychain-data.json';
import { SankeyHeader } from './SankeyHeader.jsx';
import { SankeyChart } from './SankeyChart.jsx';
import { SankeyTooltip } from './SankeyTooltip.jsx';

const CHART_HEIGHT = 620;
const COLUMN_PADDING_TOP = 36;
const NODE_WIDTH = 100;
const NODE_SPACING = 14;
const PADDING_LEFT = 0;
const PADDING_RIGHT = 0;
const MIN_CHART_WIDTH = 600;
const DEFAULT_CHART_WIDTH = 800;
const getServerContainerWidth = () => DEFAULT_CHART_WIDTH;

function useContainerWidth(containerRef) {
  const subscribe = useCallback(
    (onStoreChange) => {
      const containerElement = containerRef.current;
      if (!containerElement) return () => {};

      const resizeObserver = new ResizeObserver(onStoreChange);
      resizeObserver.observe(containerElement);
      return () => resizeObserver.disconnect();
    },
    [containerRef],
  );
  const getSnapshot = useCallback(
    () => Math.max(containerRef.current?.offsetWidth ?? DEFAULT_CHART_WIDTH, MIN_CHART_WIDTH),
    [containerRef],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerContainerWidth);
}

function findAllConnectedNodes(startNodeName, computedLinks) {
  const forwardAdjacency = {};
  const backwardAdjacency = {};
  computedLinks.forEach((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    if (!forwardAdjacency[sourceId]) forwardAdjacency[sourceId] = [];
    if (!backwardAdjacency[targetId]) backwardAdjacency[targetId] = [];
    forwardAdjacency[sourceId].push(targetId);
    backwardAdjacency[targetId].push(sourceId);
  });

  const directedBFS = (startId, adjacencyMap) => {
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const neighbors = adjacencyMap[currentId] || [];
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      });
    }
    return visited;
  };

  const downstreamNodes = directedBFS(startNodeName, forwardAdjacency);
  const upstreamNodes = directedBFS(startNodeName, backwardAdjacency);
  return new Set([...downstreamNodes, ...upstreamNodes]);
}

function hoverReducer(state, action) {
  switch (action.type) {
    case 'HOVER_NODE': {
      const { nodeId, nodeName, x, y, layoutLinks } = action;
      const volumeIn = layoutLinks
        .filter((link) => {
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return targetId === nodeId;
        })
        .reduce((total, link) => total + link.value, 0);
      const volumeOut = layoutLinks
        .filter((link) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          return sourceId === nodeId;
        })
        .reduce((total, link) => total + link.value, 0);
      const volumeToShow = volumeIn > 0 ? volumeIn : volumeOut;
      return {
        ...state,
        hoveredNodeName: nodeId,
        hoveredLink: null,
        tooltip: {
          visible: true,
          x,
          y,
          content: `${nodeName}${volumeToShow > 0 ? `\n${volumeToShow.toLocaleString()} ton` : ''}`,
        },
      };
    }
    case 'LEAVE_NODE':
      return {
        ...state,
        hoveredNodeName: null,
        tooltip: { ...state.tooltip, visible: false },
      };
    case 'HOVER_LINK': {
      const { link, x, y } = action;
      const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
      const targetName = typeof link.target === 'object' ? link.target.name : link.target;
      return {
        ...state,
        hoveredLink: { source: sourceName, target: targetName },
        hoveredNodeName: null,
        tooltip: {
          visible: true,
          x,
          y,
          content: `${sourceName} → ${targetName}\n${link.value.toLocaleString()} ton`,
        },
      };
    }
    case 'LEAVE_LINK':
      return {
        ...state,
        hoveredLink: null,
        tooltip: { ...state.tooltip, visible: false },
      };
    case 'CLEAR_HOVER':
      return {
        ...state,
        hoveredNodeName: null,
        hoveredLink: null,
        tooltip: { ...state.tooltip, visible: false },
      };
    case 'MOVE_TOOLTIP':
      return state.tooltip.visible
        ? { ...state, tooltip: { ...state.tooltip, x: action.x, y: action.y } }
        : state;
    default:
      return state;
  }
}

export function SankeySupplyChain({ kabupaten, year: yearFromProp = null }) {
  const containerRef = useRef(null);
  const containerWidth = useContainerWidth(containerRef);

  const [hoverState, dispatchHover] = useReducer(hoverReducer, {
    hoveredNodeName: null,
    hoveredLink: null,
    tooltip: { visible: false, x: 0, y: 0, content: '' },
  });

  const districtData = SUPPLY_CHAIN_DATA.data[kabupaten];
  const availableYears = useMemo(() => districtData?.tahun_tersedia ?? [], [districtData]);

  // Derive selectedYear during render instead of syncing via useEffect.
  // This fixes both no-derived-state and no-chain-state-updates.
  const [userYear, setUserYear] = useState(null);
  const defaultYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : null;
  const selectedYear = yearFromProp ?? (availableYears.includes(userYear) ? userYear : defaultYear);

  const { layoutNodes, layoutLinks } = useMemo(() => {
    if (containerWidth < 100 || !districtData) return { layoutNodes: [], layoutLinks: [] };

    const yearData = districtData[selectedYear];
    if (!yearData) return { layoutNodes: [], layoutLinks: [] };

    const allNodes = [{ id: `0:${kabupaten}`, name: kabupaten, kolom: 0 }, ...yearData.nodes];

    const allLinks = [...yearData.links];
    const millNodes = yearData.nodes.filter((n) => n.kolom === 1);
    const volumePerMill = {};
    yearData.links.forEach((link) => {
      if (link.source.startsWith('1:')) {
        volumePerMill[link.source] = (volumePerMill[link.source] || 0) + link.value;
      }
    });
    millNodes.forEach((millNode) => {
      if (volumePerMill[millNode.id]) {
        allLinks.unshift({
          source: `0:${kabupaten}`,
          target: millNode.id,
          value: volumePerMill[millNode.id],
        });
      }
    });

    const sankeyGenerator = sankey()
      .nodeId((node) => node.id)
      .nodeAlign((node) => node.kolom)
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_SPACING)
      .extent([
        [PADDING_LEFT, COLUMN_PADDING_TOP],
        [containerWidth - PADDING_RIGHT, CHART_HEIGHT],
      ]);

    const layoutResult = sankeyGenerator({
      nodes: allNodes.map((node) => ({ ...node })),
      links: allLinks.map((link) => ({ ...link })),
    });

    const nodesByLayer = {};
    layoutResult.nodes.forEach((node) => {
      const layer = node.kolom ?? 0;
      if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
      nodesByLayer[layer].push(node);
    });

    const availableHeight = CHART_HEIGHT - COLUMN_PADDING_TOP;

    const NODES_SORT_LAST = new Set([
      'Lainnya',
      'UNKNOWN',
      'UNKNOWN AFFILIATION',
      'UNKNOWN COUNTRY',
      'DOMESTIC PROCESSING AND CONSUMPTION',
    ]);
    Object.values(nodesByLayer).forEach((nodesInLayer) => {
      nodesInLayer.sort((a, b) => {
        const aLast = NODES_SORT_LAST.has(a.name) ? 1 : 0;
        const bLast = NODES_SORT_LAST.has(b.name) ? 1 : 0;
        if (aLast !== bLast) return aLast - bLast;
        return a.y0 - b.y0;
      });

      const totalHeight = nodesInLayer.reduce((sum, n) => sum + (n.y1 - n.y0), 0);

      const scaleFactor = availableHeight / totalHeight;

      let yPosition = COLUMN_PADDING_TOP;
      nodesInLayer.forEach((node) => {
        const originalHeight = node.y1 - node.y0;
        const scaledHeight = originalHeight * scaleFactor;
        node.y0 = yPosition;
        node.y1 = yPosition + scaledHeight;
        yPosition = node.y1;
      });
    });

    const totalOutflowByNode = {};
    const totalInflowByNode = {};
    layoutResult.links.forEach((link) => {
      totalOutflowByNode[link.source.id] = (totalOutflowByNode[link.source.id] || 0) + link.value;
      totalInflowByNode[link.target.id] = (totalInflowByNode[link.target.id] || 0) + link.value;
    });

    layoutResult.nodes.forEach((node) => {
      node.sourceLinks.sort((a, b) => a.target.y0 + a.target.y1 - (b.target.y0 + b.target.y1));
      node.targetLinks.sort((a, b) => a.source.y0 + a.source.y1 - (b.source.y0 + b.source.y1));
    });

    layoutResult.nodes.forEach((node) => {
      const nodeHeight = node.y1 - node.y0;
      const totalOutflow = totalOutflowByNode[node.id] || 1;
      const totalInflow = totalInflowByNode[node.id] || 1;

      let currentSourceY = node.y0;
      node.sourceLinks.forEach((link) => {
        const sourceSegmentHeight = (link.value / totalOutflow) * nodeHeight;
        link.y0 = currentSourceY + sourceSegmentHeight / 2;
        link.sourceWidth = sourceSegmentHeight;
        currentSourceY += sourceSegmentHeight;
      });

      let currentTargetY = node.y0;
      node.targetLinks.forEach((link) => {
        const targetSegmentHeight = (link.value / totalInflow) * nodeHeight;
        link.y1 = currentTargetY + targetSegmentHeight / 2;
        link.targetWidth = targetSegmentHeight;
        currentTargetY += targetSegmentHeight;
      });
    });

    return { layoutNodes: layoutResult.nodes, layoutLinks: layoutResult.links };
  }, [containerWidth, districtData, selectedYear, kabupaten]);

  const columnPositions = useMemo(() => {
    if (!layoutNodes.length) return [];
    const layerMapping = {};
    layoutNodes.forEach((node) => {
      const layer = node.layer ?? node.depth ?? 0;
      if (!layerMapping[layer]) layerMapping[layer] = [];
      layerMapping[layer].push(node);
    });
    return Object.keys(layerMapping)
      .map(Number)
      .sort((a, b) => a - b)
      .map((layer) => {
        const layerNodes = layerMapping[layer];
        const layerStartX = layerNodes[0].x0;
        const layerEndX = layerNodes[0].x1;
        return { layer, x0: layerStartX, x1: layerEndX, centerX: (layerStartX + layerEndX) / 2 };
      });
  }, [layoutNodes]);

  const connectedNodesSet = useMemo(() => {
    if (!hoverState.hoveredNodeName) return null;
    return findAllConnectedNodes(hoverState.hoveredNodeName, layoutLinks);
  }, [hoverState.hoveredNodeName, layoutLinks]);

  return (
    <div ref={containerRef} className="w-full border border-gray-200 rounded-xl">
      <SankeyHeader
        yearFromProp={yearFromProp}
        availableYears={availableYears}
        selectedYear={selectedYear}
        onYearChange={setUserYear}
      />
      <div className="bg-white select-none overflow-x-auto">
        <SankeyChart
          containerWidth={containerWidth}
          chartHeight={CHART_HEIGHT}
          layoutNodes={layoutNodes}
          layoutLinks={layoutLinks}
          columnPositions={columnPositions}
          connectedNodesSet={connectedNodesSet}
          hoveredNodeName={hoverState.hoveredNodeName}
          hoveredLink={hoverState.hoveredLink}
          onNodeEnter={(event, node) =>
            dispatchHover({
              type: 'HOVER_NODE',
              nodeId: node.id,
              nodeName: node.name,
              x: event.clientX,
              y: event.clientY,
              layoutLinks,
            })
          }
          onNodeLeave={() => dispatchHover({ type: 'LEAVE_NODE' })}
          onLinkEnter={(event, link) =>
            dispatchHover({ type: 'HOVER_LINK', link, x: event.clientX, y: event.clientY })
          }
          onLinkLeave={() => dispatchHover({ type: 'LEAVE_LINK' })}
          onMouseMove={(event) =>
            dispatchHover({ type: 'MOVE_TOOLTIP', x: event.clientX, y: event.clientY })
          }
          onMouseLeave={() => dispatchHover({ type: 'CLEAR_HOVER' })}
        />
      </div>
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 rounded-b-xl">
        <p className="text-[10px] text-gray-400 text-right">
          Satuan: ton CPO &nbsp;·&nbsp; Tahun: {selectedYear} &nbsp;·&nbsp; Sumber: Trase.earth
        </p>
      </div>
      <SankeyTooltip tooltip={hoverState.tooltip} />
    </div>
  );
}
