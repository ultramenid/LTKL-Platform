import { COLORS } from '../../config/constants.js';

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

export function SankeyChart({
  containerWidth,
  chartHeight,
  layoutNodes,
  layoutLinks,
  columnPositions,
  connectedNodesSet,
  hoveredNodeName,
  hoveredLink,
  onNodeEnter,
  onNodeLeave,
  onLinkEnter,
  onLinkLeave,
  onMouseMove,
  onMouseLeave,
}) {
  const isNodeHighlighted = (nodeId) => !connectedNodesSet || connectedNodesSet.has(nodeId);

  const isLinkHighlighted = (link) => {
    if (!connectedNodesSet) return true;
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return connectedNodesSet.has(sourceId) && connectedNodesSet.has(targetId);
  };

  return (
    <svg
      width={containerWidth}
      height={chartHeight}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
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
            onMouseEnter={(event) => onLinkEnter(event, link)}
            onMouseLeave={onLinkLeave}
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
            onMouseEnter={(event) => onNodeEnter(event, node)}
            onMouseLeave={onNodeLeave}
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
  );
}
