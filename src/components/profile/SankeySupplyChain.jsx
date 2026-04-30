import { useRef, useState, useEffect, useMemo } from 'react';
import { sankey } from 'd3-sankey';
import { COLORS } from '../../config/constants.js';
import SUPPLY_CHAIN_DATA from '../../data/supplychain-data.json';

// Interactive Sankey component styled after Trase.earth — D3 layout, rendered as React SVG

// ─── LAYOUT CONSTANTS (chart size, spacing, padding) ───
const CHART_HEIGHT = 620; // Total visualization area height
const COLUMN_PADDING_TOP = 36; // Top space for column header labels
const NODE_WIDTH = 100; // Width of each rectangular node
const NODE_SPACING = 14; // Vertical spacing between nodes
const PADDING_LEFT = 0; // Left padding so nodes don't touch edge
const PADDING_RIGHT = 0; // Right padding so nodes don't touch edge
const MIN_CHART_WIDTH = 600; // Minimum width so 4 columns remain readable; enable scroll if smaller

// ─── COLUMN HEADER LABELS (column titles in chart) ───
const COLUMN_LABELS = ['Kabupaten', 'Mill group', 'Exporter', 'Destination'];

// ─── STATIC DATA: INDONESIA CPO SUPPLY CHAIN NODES 2022 ───
// Each node has `depth` to force a specific column in the layout

// ─── HELPER: SPLIT LONG TEXT INTO LINES (SVG <text> doesn't support auto word-wrap) ───
function breakTextIntoLines(nodeText, maxCharsPerLine = 13) {
  const words = nodeText.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach((word) => {
    const combined = currentLine ? `${currentLine} ${word}` : word;
    if (combined.length <= maxCharsPerLine) {
      currentLine = combined;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  // Limit to max 3 lines to prevent overflow outside node
  return lines.slice(0, 3);
}

// ─── HELPER: BIDIRECTIONAL BFS TO FIND NODE TRAJECTORY (upstream & downstream) ───
function findAllConnectedNodes(startNodeName, computedLinks) {
  const forwardAdjacency = {};
  const backwardAdjacency = {};
  computedLinks.forEach((link) => {
    // Extract ID if node is an object (resolved result from d3-sankey)
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    if (!forwardAdjacency[sourceId]) forwardAdjacency[sourceId] = [];
    if (!backwardAdjacency[targetId]) backwardAdjacency[targetId] = [];
    forwardAdjacency[sourceId].push(targetId);
    backwardAdjacency[targetId].push(sourceId);
  });

  // One-direction BFS — only traverses in one direction
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

  // Merge forward BFS (downstream) + backward BFS (upstream) results
  const downstreamNodes = directedBFS(startNodeName, forwardAdjacency);
  const upstreamNodes = directedBFS(startNodeName, backwardAdjacency);
  return new Set([...downstreamNodes, ...upstreamNodes]);
}

// ─── HELPER: CUSTOM LINK PATH GENERATOR (different widths at source vs target ends) ───
// d3's built-in sankeyLinkHorizontal doesn't support different widths at both ends, so
// after scaling nodes per column independently, paths must be built manually
function variableWidthLinkPath(link) {
  const sourceX = link.source.x1;
  const targetX = link.target.x0;
  const controlX = (sourceX + targetX) / 2;
  const sourceHalfWidth = (link.sourceWidth ?? link.width ?? 1) / 2;
  const targetHalfWidth = (link.targetWidth ?? link.width ?? 1) / 2;
  return (
    `M${sourceX},${link.y0 - sourceHalfWidth}` +
    `C${controlX},${link.y0 - sourceHalfWidth} ${controlX},${link.y1 - targetHalfWidth} ${targetX},${link.y1 - targetHalfWidth}` +
    `L${targetX},${link.y1 + targetHalfWidth}` +
    `C${controlX},${link.y1 + targetHalfWidth} ${controlX},${link.y0 + sourceHalfWidth} ${sourceX},${link.y0 + sourceHalfWidth}` +
    'Z'
  );
}

// ─── MAIN COMPONENT (interactive Sankey with hover trajectory) ───
export function SankeySupplyChain({ kabupaten, tahunDipilih: yearFromProp = null }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const [hoveredNodeName, setHoveredNodeName] = useState(null);

  // Hover state on link — also triggers full trajectory highlight
  const [hoveredLink, setHoveredLink] = useState(null);

  // Extract available year list for kabupaten
  const districtData = SUPPLY_CHAIN_DATA.data[kabupaten];
  const availableYears = districtData?.tahun_tersedia || [];

  // Use year from prop if parent controls it; otherwise internal state for compatibility
  const [internalYear, setInternalYear] = useState(availableYears[availableYears.length - 1]);
  const selectedYear = yearFromProp ?? internalYear;

  // Sync internal year when kabupaten changes (only if parent doesn't control it)
  useEffect(() => {
    if (!yearFromProp && availableYears.length > 0 && !availableYears.includes(internalYear)) {
      setInternalYear(availableYears[availableYears.length - 1]);
    }
  }, [kabupaten, yearFromProp]);

  // Tooltip state: position + text content for hovered node and link
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  // Responsively monitor container width via ResizeObserver with MIN_CHART_WIDTH floor
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const firstEntry = entries[0];
      // Clamp width so 4 Sankey columns remain readable on narrow screens; enable scroll if smaller
      if (firstEntry) setContainerWidth(Math.max(firstEntry.contentRect.width, MIN_CHART_WIDTH));
    });
    resizeObserver.observe(containerElement);
    // Set initial width without waiting for first event
    setContainerWidth(Math.max(containerElement.offsetWidth, MIN_CHART_WIDTH));
    return () => resizeObserver.disconnect();
  }, []);

  // ─── D3 SANKEY LAYOUT (node and link positions with full-height scaling) ───
  // D3 sankey mutates input objects, so deep-copy is required on every render
  const { layoutNodes, layoutLinks } = useMemo(() => {
    if (containerWidth < 100 || !districtData) return { layoutNodes: [], layoutLinks: [] };

    // Get data for selected year
    const yearData = districtData[selectedYear];
    if (!yearData) return { layoutNodes: [], layoutLinks: [] };

    // Add source kabupaten node at column 0
    const allNodes = [{ id: `0:${kabupaten}`, name: kabupaten, kolom: 0 }, ...yearData.nodes];

    // Add links from kabupaten to mill groups (tier 1) based on total volume per mill
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

    // ─── NODE SCALING TO FILL FULL HEIGHT PER COLUMN (proportional to volume) ───
    // Group nodes per column for proportional scaling
    const nodesByLayer = {};
    layoutResult.nodes.forEach((node) => {
      const layer = node.kolom ?? 0;
      if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
      nodesByLayer[layer].push(node);
    });

    // Calculate available height for scaling (total height minus header padding)
    const availableHeight = CHART_HEIGHT - COLUMN_PADDING_TOP;

    // Scale nodes in each column proportionally to fill full height
    // "Catch-all" nodes (Lainnya, Unknown, Domestic) always at bottom per column
    const NODES_SORT_LAST = new Set([
      'Lainnya',
      'UNKNOWN',
      'UNKNOWN AFFILIATION',
      'UNKNOWN COUNTRY',
      'DOMESTIC PROCESSING AND CONSUMPTION',
    ]);
    Object.values(nodesByLayer).forEach((nodesInLayer) => {
      // Sort nodes: identified nodes follow d3 y0, summary nodes always at the end
      nodesInLayer.sort((a, b) => {
        const aLast = NODES_SORT_LAST.has(a.name) ? 1 : 0;
        const bLast = NODES_SORT_LAST.has(b.name) ? 1 : 0;
        if (aLast !== bLast) return aLast - bLast;
        return a.y0 - b.y0;
      });

      // Calculate total height of all nodes before scaling (before expansion)
      const totalHeight = nodesInLayer.reduce((sum, n) => sum + (n.y1 - n.y0), 0);

      // Scaling factor to fill available height proportionally
      const scaleFactor = availableHeight / totalHeight;

      // Apply scaling: expand nodes proportionally while preserving relative position
      let yPosition = COLUMN_PADDING_TOP;
      nodesInLayer.forEach((node) => {
        const originalHeight = node.y1 - node.y0;
        const scaledHeight = originalHeight * scaleFactor;
        node.y0 = yPosition;
        node.y1 = yPosition + scaledHeight;
        yPosition = node.y1;
      });
    });

    // ─── LINK POSITION REDISTRIBUTION AFTER NODE SCALING ───
    // After nodes are scaled per column, all d3 y0/y1/width values become invalid.
    // Recalculate fully so each link side follows the actual node height.

    // Calculate total outgoing and incoming volume per node
    const totalOutflowByNode = {};
    const totalInflowByNode = {};
    layoutResult.links.forEach((link) => {
      totalOutflowByNode[link.source.id] = (totalOutflowByNode[link.source.id] || 0) + link.value;
      totalInflowByNode[link.target.id] = (totalInflowByNode[link.target.id] || 0) + link.value;
    });

    // Sort links per node to avoid crossing — use opponent node vertical position as sort key
    layoutResult.nodes.forEach((node) => {
      node.sourceLinks.sort((a, b) => a.target.y0 + a.target.y1 - (b.target.y0 + b.target.y1));
      node.targetLinks.sort((a, b) => a.source.y0 + a.source.y1 - (b.source.y0 + b.source.y1));
    });

    // Lay out links from y0 to y1 node — proportional without clamping so they always fill fully
    layoutResult.nodes.forEach((node) => {
      const nodeHeight = node.y1 - node.y0;
      const totalOutflow = totalOutflowByNode[node.id] || 1;
      const totalInflow = totalInflowByNode[node.id] || 1;

      // Outgoing side (source): arrange top to bottom
      let currentSourceY = node.y0;
      node.sourceLinks.forEach((link) => {
        const sourceSegmentHeight = (link.value / totalOutflow) * nodeHeight;
        link.y0 = currentSourceY + sourceSegmentHeight / 2; // midpoint for path generator
        link.sourceWidth = sourceSegmentHeight;
        currentSourceY += sourceSegmentHeight;
      });

      // Incoming side (target): arrange top to bottom
      let currentTargetY = node.y0;
      node.targetLinks.forEach((link) => {
        const targetSegmentHeight = (link.value / totalInflow) * nodeHeight;
        link.y1 = currentTargetY + targetSegmentHeight / 2;
        link.targetWidth = targetSegmentHeight;
        currentTargetY += targetSegmentHeight;
      });
    });

    return { layoutNodes: layoutResult.nodes, layoutLinks: layoutResult.links };
  }, [containerWidth, districtData, selectedYear]);

  // ─── COLUMN POSITIONS FOR HEADER LABELS (extract X coordinates per layer) ───
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
        // All nodes in the same layer have identical x0 and x1
        const layerStartX = layerNodes[0].x0;
        const layerEndX = layerNodes[0].x1;
        return { layer, x0: layerStartX, x1: layerEndX, centerX: (layerStartX + layerEndX) / 2 };
      });
  }, [layoutNodes]);

  // ─── BFS TRAJECTORY ON NODE HOVER (upstream and downstream nodes) ───
  const connectedNodesSet = useMemo(() => {
    if (!hoveredNodeName) return null;
    return findAllConnectedNodes(hoveredNodeName, layoutLinks);
  }, [hoveredNodeName, layoutLinks]);

  const isNodeHighlighted = (nodeId) => !connectedNodesSet || connectedNodesSet.has(nodeId);

  const isLinkHighlighted = (link) => {
    if (!connectedNodesSet) return true;
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return connectedNodesSet.has(sourceId) && connectedNodesSet.has(targetId);
  };

  // ─── TOOLTIP HANDLER (hover node and link with volume info) ───
  const showNodeTooltip = (event, nodeId, nodeName) => {
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
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      content: `${nodeName}${volumeToShow > 0 ? `\n${volumeToShow.toLocaleString()} ton` : ''}`,
    });
  };

  const showLinkTooltip = (event, link) => {
    const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
    const targetName = typeof link.target === 'object' ? link.target.name : link.target;
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      content: `${sourceName} → ${targetName}\n${link.value.toLocaleString()} ton`,
    });
  };

  const hideTooltip = () => setTooltip((prev) => ({ ...prev, visible: false }));

  const updateTooltipPosition = (event) => {
    if (tooltip.visible) {
      setTooltip((prev) => ({ ...prev, x: event.clientX, y: event.clientY }));
    }
  };

  // ─── RENDER (interactive Sankey chart with toolbar) ───
  return (
    <div ref={containerRef} className="w-full border border-gray-200 rounded-xl">
      {/* ─── TOOLBAR ATAS: dropdown tahun + tombol unduh (gaya Trase.earth) ───*/}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-end gap-3 rounded-t-xl">
        {/* Tahun dropdown — hanya tampil jika parent tidak mengontrol tahun */}
        {!yearFromProp && availableYears.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Tahun</span>
            <div className="relative">
              <select
                value={internalYear}
                onChange={(choice) => setInternalYear(Number(choice.target.value))}
                className="appearance-none pl-3 pr-7 py-1.5 text-[12px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-gray-400 transition focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': COLORS.PRIMARY }}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {/* Ikon chevron manual agar tampilan konsisten lintas browser */}
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
              >
                <path
                  d="M1 1l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Pemisah visual */}
        {!yearFromProp && <div className="w-px h-5 bg-gray-200" />}

        {/* Tombol unduh (dummy) */}
        <button className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md hover:border-gray-400 transition cursor-pointer">
          Unduh Pilihan
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-400">
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ─── AREA GRAFIK SVG (mendukung scroll horizontal untuk layar sempit) ───*/}
      <div className="bg-white select-none overflow-x-auto">
        <svg
          width={containerWidth}
          height={CHART_HEIGHT}
          onMouseMove={updateTooltipPosition}
          onMouseLeave={() => {
            setHoveredNodeName(null);
            setHoveredLink(null);
            hideTooltip();
          }}
        >
          {/* ─── LABEL HEADER KOLOM + PANAH PENGHUBUNG ───*/}
          {/* Dirender pertama agar di layer paling bawah SVG */}
          {columnPositions.map((column, columnIndex) => (
            <g key={`header-column-${column.layer}`}>
              <text
                x={column.centerX}
                y={16}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fontFamily="inherit"
                fill={COLORS.PRIMARY}
                letterSpacing="0.08em"
                style={{ textTransform: 'uppercase' }}
              >
                {COLUMN_LABELS[columnIndex]?.toUpperCase()}
              </text>
              {/* Horizontal line + arrow menuju kolom subsequent */}
              {columnIndex < columnPositions.length - 1 &&
                (() => {
                  const lineStartX = column.x1 + 6;
                  const lineEndX = columnPositions[columnIndex + 1].x0 - 10;
                  const lineY = 15;
                  return (
                    <g>
                      <line
                        x1={lineStartX}
                        y1={lineY}
                        x2={lineEndX}
                        y2={lineY}
                        stroke="#d1d5db"
                        strokeWidth={1}
                      />
                      {/* Arrow head */}
                      <path
                        d={`M${lineEndX} ${lineY - 4} L${lineEndX + 7} ${lineY} L${lineEndX} ${lineY + 4}`}
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })()}
            </g>
          ))}
          {/* ─── LINKS (aliran antar node) ───*/}
          {layoutLinks.map((link, linkIndex) => {
            const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
            const targetName = typeof link.target === 'object' ? link.target.name : link.target;

            // Highlight logic: hover node → full trajectory, hover link → only that link, idle → all dim
            const isLinkHovered =
              hoveredLink && hoveredLink.source === sourceName && hoveredLink.target === targetName;
            const isTrajectoryLink = hoveredNodeName !== null && isLinkHighlighted(link);
            const isHighlighted = isLinkHovered || isTrajectoryLink;
            const anyHoverActive = hoveredNodeName !== null || hoveredLink !== null;
            // Fill-based rendering: closed path makes source and target widths display accurately
            const fillColor = isHighlighted ? COLORS.PRIMARY : '#d1d5db';
            const fillOpacity = isHighlighted ? 0.75 : anyHoverActive ? 0.26 : 0.4;
            return (
              <path
                key={`link-${linkIndex}-${sourceName}-${targetName}`}
                d={variableWidthLinkPath(link)}
                fill={fillColor}
                stroke="none"
                style={{
                  fillOpacity,
                  cursor: 'crosshair',
                  transition: 'fill 0.2s, fill-opacity 0.2s',
                }}
                onMouseEnter={(event) => {
                  setHoveredLink({ source: sourceName, target: targetName });
                  showLinkTooltip(event, link);
                }}
                onMouseLeave={() => {
                  setHoveredLink(null);
                  hideTooltip();
                }}
              />
            );
          })}

          {/* ─── NODES (balok persegi panjang dengan label) ───*/}
          {layoutNodes.map((node) => {
            // Hover node triggers trajectory highlight — hover link doesn't change node colors
            const hasHover = hoveredNodeName !== null;
            const isHighlighted = isNodeHighlighted(node.id);
            // At rest use white border; when active use solid PRIMARY color
            const fillColor = hasHover && isHighlighted ? COLORS.PRIMARY : '#ffffff';
            const borderColor = hasHover && isHighlighted ? COLORS.PRIMARY : '#d1d5db';
            const labelColor = hasHover && isHighlighted ? '#ffffff' : '#6b7280';
            const nodeHeight = Math.max(4, node.y1 - node.y0);
            const centerX = (node.x0 + node.x1) / 2;
            const centerY = node.y0 + nodeHeight / 2;
            // For small nodes, limit to 1 line to prevent overflow
            const maxLines = nodeHeight < 20 ? 1 : 3;
            const textLines = breakTextIntoLines(node.name).slice(0, maxLines);
            // Font size follows node height: very small nodes use 6px, large nodes use 9px
            const fontSize =
              nodeHeight < 12
                ? 6
                : nodeHeight < 20
                  ? 7
                  : nodeHeight < 30
                    ? 8
                    : textLines.length > 2
                      ? 8
                      : 9;
            const lineSpacing = fontSize + 2;

            return (
              <g
                key={`node-${node.id}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(event) => {
                  setHoveredNodeName(node.id);
                  showNodeTooltip(event, node.id, node.name);
                }}
                onMouseLeave={() => {
                  setHoveredNodeName(null);
                  hideTooltip();
                }}
              >
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={node.x1 - node.x0}
                  height={nodeHeight}
                  fill={fillColor}
                  stroke={borderColor}
                  strokeWidth={1}
                  style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                />
                {/* Tampilkan teks jika node cukup tinggi untuk memuat minimal 1 baris */}
                {nodeHeight >= 8 && (
                  <text textAnchor="middle" dominantBaseline="auto" pointerEvents="none">
                    {textLines.map((line, lineIndex) => {
                      // Vertical offset to center all lines in the middle of the node
                      const totalTextHeight = textLines.length * lineSpacing - 3;
                      const offsetY =
                        centerY - totalTextHeight / 2 + lineIndex * lineSpacing + fontSize;
                      return (
                        <tspan
                          key={`label-${node.id}-${lineIndex}`}
                          x={centerX}
                          y={offsetY}
                          fontSize={fontSize}
                          fontWeight={600}
                          fontFamily="inherit"
                          fill={labelColor}
                          style={{ transition: 'fill 0.2s' }}
                        >
                          {line}
                        </tspan>
                      );
                    })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer: informasi sumber data dan satuan */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 rounded-b-xl">
        <p className="text-[10px] text-gray-400 text-right">
          Satuan: ton CPO &nbsp;·&nbsp; Tahun: {selectedYear} &nbsp;·&nbsp; Sumber: Trase.earth
        </p>
      </div>

      {/* Tooltip melayang */}
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-xl text-xs leading-relaxed"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            backgroundColor: 'rgba(15,23,42,0.95)',
            borderColor: COLORS.PRIMARY,
            borderWidth: 1,
            borderStyle: 'solid',
            color: '#f1f5f9',
            whiteSpace: 'pre-wrap',
            minWidth: 160,
            maxWidth: 280,
          }}
        >
          {tooltip.content.split('\n').map((lineText, lineIndex) => (
            <span
              key={lineIndex}
              style={{
                display: 'block',
                fontWeight: lineIndex === 0 ? 700 : 400,
                color: lineIndex === 0 ? COLORS.PRIMARY : '#cbd5e1',
              }}
            >
              {lineText}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
