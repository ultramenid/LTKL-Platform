// Track mouse position at the document level so viewport coordinates are
// always available inside the ECharts position callback, where the native
// event may be absent (Sankey node/edge hover, programmatic triggers).
let _lastMouseX = 0;
let _lastMouseY = 0;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'mousemove',
    (e) => {
      _lastMouseX = e.clientX;
      _lastMouseY = e.clientY;
    },
    { capture: true, passive: true },
  );
}

/**
 * ECharts tooltip `position` callback that clamps the tooltip inside the
 * browser viewport. Use with `appendToBody: true` and `confine: false`.
 *
 * The callback MUST return chart-relative pixel coordinates — ECharts then
 * transforms them to absolute body coordinates via its internal makeStyleCoord.
 * Without `confine: false`, ECharts would double-clamp to the small chart area.
 *
 * Strategy: derive the chart container's viewport offset from `point`
 * (chart-relative cursor) and the global mouse tracker, compute the desired
 * viewport position with overflow clamping, then convert back to chart-relative.
 */
export function makeViewportTooltipPosition() {
  return (point, _params, _dom, _rect, size) => {
    // `point` is the cursor in chart-relative pixels. Subtracting it from the
    // tracked viewport cursor gives the chart container's viewport origin.
    const chartLeft = _lastMouseX - (point?.[0] ?? 0);
    const chartTop = _lastMouseY - (point?.[1] ?? 0);

    const tooltipWidth = size?.contentSize?.[0] ?? 200;
    const tooltipHeight = size?.contentSize?.[1] ?? 80;
    const margin = 8;
    const offset = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer right of cursor; flip left if tooltip would overflow the right edge
    let vx = _lastMouseX + offset;
    if (vx + tooltipWidth + margin > vw) {
      vx = _lastMouseX - tooltipWidth - offset;
    }
    vx = Math.max(margin, Math.min(vx, vw - tooltipWidth - margin));

    // Prefer below cursor; flip above if tooltip would overflow the bottom edge
    let vy = _lastMouseY + offset;
    if (vy + tooltipHeight + margin > vh) {
      vy = _lastMouseY - tooltipHeight - offset;
    }
    vy = Math.max(margin, Math.min(vy, vh - tooltipHeight - margin));

    // Convert viewport coords back to chart-relative so ECharts can transform
    // them correctly to absolute body coordinates via its internal makeStyleCoord.
    return [vx - chartLeft, vy - chartTop];
  };
}
