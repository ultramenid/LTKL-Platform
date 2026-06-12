import { COLORS } from '../../config/constants.js';

// ─── SHARED CHART HEADER ───
// One header for all three analytics cards so titles, subtitles, and chart
// tops stay baseline-aligned regardless of which card renders a right slot.
export function ChartHeader({ title, subtitle, children }) {
  return (
    <div className="shrink-0 flex items-start justify-between gap-4 px-5 pt-3.5 pb-2 min-h-[58px]">
      <div className="min-w-0">
        <h3 className="text-[14px] font-medium tracking-tight leading-snug text-coffee-900 truncate">
          {title}
        </h3>
        <p className="mt-0.5 text-[10px] font-normal text-coffee-400 truncate">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

// Shared loading-state timing — all chart skeletons breathe on the same cycle
const SKELETON_CYCLE_MS = 3200;
const SKELETON_STAGGER_MS = 150;

// Mirrors ChartHeader metrics so the real header lands without a layout jump
function SkeletonChartHeader({ showActionButton = false }) {
  return (
    <div className="shrink-0 flex items-start justify-between gap-4 px-5 pt-4 pb-2.5 min-h-[58px]">
      <div className="space-y-1.5">
        <div className="h-3.5 w-40 bg-parchment-300 rounded animate-pulse" />
        <div className="h-2.5 w-52 bg-parchment-200 rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-1.5 pt-0.5">
        <div className="h-[18px] w-[72px] bg-parchment-200 rounded-full animate-pulse" />
        {showActionButton && (
          <div className="h-[18px] w-[18px] bg-parchment-200 rounded-md animate-pulse" />
        )}
      </div>
    </div>
  );
}

// ─── BAR CHART SKELETON ───
// Bars rise from the baseline in sequence, hold, release, and rise again —
// same cycle and stagger as the sankey weave so the panel breathes as one.
const SKELETON_BARS = [
  { heightPercent: 55 },
  { heightPercent: 80, accent: true },
  { heightPercent: 65 },
  { heightPercent: 90 },
  { heightPercent: 45 },
  { heightPercent: 70 },
  { heightPercent: 60, accent: true },
  { heightPercent: 85 },
  { heightPercent: 50 },
];

export function LoadingChartSkeleton() {
  return (
    <output
      className="w-full h-full flex flex-col overflow-hidden"
      aria-label="Memuat data tutupan lahan"
    >
      <SkeletonChartHeader />

      <div className="flex-1 min-h-0 flex items-end gap-2.5 px-7">
        {SKELETON_BARS.map((bar, index) => (
          <div
            key={index}
            className={`chart-bar-rise flex-1 rounded-t ${
              bar.accent ? 'bg-primary/40' : 'bg-parchment-300/80'
            }`}
            style={{
              height: `${bar.heightPercent}%`,
              animationDuration: `${SKELETON_CYCLE_MS}ms`,
              animationDelay: `${index * SKELETON_STAGGER_MS}ms`,
            }}
          />
        ))}
      </div>

      {/* Baseline + axis label placeholders */}
      <div className="shrink-0 px-7">
        <div className="h-px w-full bg-parchment-300" />
        <div className="flex justify-between py-1.5">
          {SKELETON_BARS.map((_, index) => (
            <div key={index} className="h-1.5 w-5 bg-parchment-200 rounded animate-pulse" />
          ))}
        </div>
      </div>

      <div className="shrink-0 pb-2.5 text-center">
        <p className="text-[10px] text-coffee-400 tracking-wide animate-pulse">
          Memuat data tutupan lahan…
        </p>
      </div>
    </output>
  );
}

// ─── SANKEY WEAVE SKELETON ───
// viewBox: 200 wide × 100 tall. Left nodes at x=0 w=7, right nodes at x=193 w=7.
// Each flow ribbon draws itself left → right (stroke-dashoffset on pathLength=1),
// staggered like threads on a loom; nodes glow as their flows arrive.
const SANKEY_LEFT_NODES = [
  { y: 2,  h: 36 },
  { y: 42, h: 14 },
  { y: 60, h: 9 },
  { y: 73, h: 7 },
  { y: 84, h: 5 },
  { y: 93, h: 5 },
];
const SANKEY_RIGHT_NODES = [
  { y: 2,  h: 26 },
  { y: 32, h: 17 },
  { y: 53, h: 11 },
  { y: 68, h: 9 },
  { y: 81, h: 7 },
  { y: 92, h: 6 },
];
// Each flow: source node index on left, target node index on right.
// Crossings (0→1, 1→0, 2→4, 4→2) make the silhouette read as a real sankey.
const SANKEY_FLOWS = [
  { li: 0, ri: 0, accent: true },
  { li: 0, ri: 1 },
  { li: 1, ri: 0 },
  { li: 1, ri: 2 },
  { li: 2, ri: 4 },
  { li: 3, ri: 3 },
  { li: 4, ri: 2, accent: true },
  { li: 5, ri: 5 },
];

export function SankeyLoadingSkeleton() {
  return (
    <output
      className="w-full h-full flex flex-col overflow-hidden"
      aria-label="Memuat data transisi tutupan lahan"
    >
      <SkeletonChartHeader showActionButton />


      <div className="flex-1 relative overflow-hidden px-2">
        <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sankey-weave-thread" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d0e7e4" />
              <stop offset="100%" stopColor="#b3d4d0" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="sankey-weave-thread-accent" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.PRIMARY} stopOpacity="0.5" />
              <stop offset="100%" stopColor={COLORS.PRIMARY} stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Flow ribbons — drawn in, held, released, rewoven */}
          {SANKEY_FLOWS.map((flow, index) => {
            const leftNode = SANKEY_LEFT_NODES[flow.li];
            const rightNode = SANKEY_RIGHT_NODES[flow.ri];
            const leftMid = leftNode.y + leftNode.h / 2;
            const rightMid = rightNode.y + rightNode.h / 2;
            const strokeWidth = Math.min(leftNode.h, rightNode.h) * 0.72;
            return (
              <path
                key={index}
                className="sankey-weave-path"
                d={`M 7,${leftMid} C 85,${leftMid} 115,${rightMid} 193,${rightMid}`}
                pathLength="1"
                fill="none"
                stroke={
                  flow.accent ? 'url(#sankey-weave-thread-accent)' : 'url(#sankey-weave-thread)'
                }
                strokeWidth={strokeWidth}
                strokeOpacity={flow.accent ? 0.5 : 0.8}
                style={{
                  animationDuration: `${SKELETON_CYCLE_MS}ms`,
                  animationDelay: `${index * SKELETON_STAGGER_MS}ms`,
                }}
              />
            );
          })}

          {/* Left nodes — anchors, steady glow from the start of each cycle */}
          {SANKEY_LEFT_NODES.map((node, index) => (
            <rect
              key={index}
              className="sankey-weave-node"
              x="0" y={node.y} width="7" height={node.h}
              rx="1.5"
              fill={index === 0 ? COLORS.PRIMARY : '#d0e7e4'}
              style={{
                animationDuration: `${SKELETON_CYCLE_MS}ms`,
                animationDelay: `${index * SKELETON_STAGGER_MS}ms`,
              }}
            />
          ))}

          {/* Right nodes — glow later, when their threads land */}
          {SANKEY_RIGHT_NODES.map((node, index) => (
            <rect
              key={index}
              className="sankey-weave-node"
              x="193" y={node.y} width="7" height={node.h}
              rx="1.5"
              fill={index === 0 ? COLORS.PRIMARY : '#d0e7e4'}
              style={{
                animationDuration: `${SKELETON_CYCLE_MS}ms`,
                animationDelay: `${SKELETON_CYCLE_MS * 0.3 + index * SKELETON_STAGGER_MS}ms`,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Microcopy — quiet caption, fades with the weave rhythm */}
      <div className="shrink-0 pb-2.5 text-center">
        <p className="text-[10px] text-coffee-400 tracking-wide animate-pulse">
          Menyusun aliran transisi…
        </p>
      </div>
    </output>
  );
}

export function ChartErrorState({ message }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 p-6 text-center">
      <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
        <span className="text-red-400 text-sm font-bold">!</span>
      </div>
      <p className="text-[13px] font-medium text-coffee-600">Gagal memuat data</p>
      <p className="text-[11px] text-coffee-400 leading-relaxed max-w-xs">{message}</p>
    </div>
  );
}

export function ChartEmptyState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-[12px] text-coffee-400">Tidak ada data tersedia</p>
    </div>
  );
}


