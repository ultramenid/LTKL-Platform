import { useRef, useState, useEffect, useMemo } from 'react';
import { sankey } from 'd3-sankey';
import { COLORS } from '../../config/constants.js';
import SUPPLY_CHAIN_DATA from '../../data/supplychain-data.json';

const CHART_HEIGHT = 620;
const COLUMN_PADDING_TOP = 36;
const NODE_WIDTH = 100;
const NODE_SPACING = 14;
const PADDING_LEFT = 0;
const PADDING_RIGHT = 0;
const MIN_CHART_WIDTH = 600;

const COLUMN_LABELS = ['Kabupaten', 'Mill group', 'Exporter', 'Destination'];

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
  return lines.slice(0, 3);
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

export function SankeySupplyChain({ kabupaten, year: yearFromProp = null }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const [hoveredNodeName, setHoveredNodeName] = useState(null);

  const [hoveredLink, setHoveredLink] = useState(null);

  const districtData = SUPPLY_CHAIN_DATA.data[kabupaten];
  const availableYears = useMemo(() => districtData?.tahun_tersedia ?? [], [districtData]);

  const [internalYear, setInternalYear] = useState(availableYears[availableYears.length - 1]);
  const selectedYear = yearFromProp ?? internalYear;

  useEffect(() => {
    if (!yearFromProp && availableYears.length > 0 && !availableYears.includes(internalYear)) {
      setInternalYear(availableYears[availableYears.length - 1]);
    }
  }, [kabupaten, yearFromProp, availableYears, internalYear]);

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const firstEntry = entries[0];
      if (firstEntry) setContainerWidth(Math.max(firstEntry.contentRect.width, MIN_CHART_WIDTH));
    });
    resizeObserver.observe(containerElement);
    setContainerWidth(Math.max(containerElement.offsetWidth, MIN_CHART_WIDTH));
    return () => resizeObserver.disconnect();
  }, []);

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

  return (
    <div ref={containerRef} className="w-full border border-gray-200 rounded-xl">
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-end gap-3 rounded-t-xl">
        {!yearFromProp && availableYears.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Tahun</span>
            <div className="relative">
              <select
                value={internalYear}
                onChange={(event) => setInternalYear(Number(event.target.value))}
                className="appearance-none pl-3 pr-7 py-1.5 text-[12px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-gray-400 transition focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': COLORS.PRIMARY }}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

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

        {!yearFromProp && <div className="w-px h-5 bg-gray-200" />}

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

          {layoutLinks.map((link, linkIndex) => {
            const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
            const targetName = typeof link.target === 'object' ? link.target.name : link.target;

            const isLinkHovered =
              hoveredLink && hoveredLink.source === sourceName && hoveredLink.target === targetName;
            const isTrajectoryLink = hoveredNodeName !== null && isLinkHighlighted(link);
            const isHighlighted = isLinkHovered || isTrajectoryLink;
            const anyHoverActive = hoveredNodeName !== null || hoveredLink !== null;
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

          {layoutNodes.map((node) => {
            const hasHover = hoveredNodeName !== null;
            const isHighlighted = isNodeHighlighted(node.id);
            const fillColor = hasHover && isHighlighted ? COLORS.PRIMARY : '#ffffff';
            const borderColor = hasHover && isHighlighted ? COLORS.PRIMARY : '#d1d5db';
            const labelColor = hasHover && isHighlighted ? '#ffffff' : '#6b7280';
            const nodeHeight = Math.max(4, node.y1 - node.y0);
            const centerX = (node.x0 + node.x1) / 2;
            const centerY = node.y0 + nodeHeight / 2;
            const maxLines = nodeHeight < 20 ? 1 : 3;
            const textLines = breakTextIntoLines(node.name).slice(0, maxLines);
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

                {nodeHeight >= 8 && (
                  <text textAnchor="middle" dominantBaseline="auto" pointerEvents="none">
                    {textLines.map((line, lineIndex) => {
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

      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 rounded-b-xl">
        <p className="text-[10px] text-gray-400 text-right">
          Satuan: ton CPO &nbsp;·&nbsp; Tahun: {selectedYear} &nbsp;·&nbsp; Sumber: Trase.earth
        </p>
      </div>

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
