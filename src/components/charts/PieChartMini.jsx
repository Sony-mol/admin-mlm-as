import React, { useMemo, useState } from 'react';

/**
 * PieChartMini (centered, responsive, safe margin)
 * - Spin-in on mount
 * - Hover tooltip + slight explode offset
 * - Tooltip shows "referrals : <count>" (no currency)
 * - Safe inner margin so hover "explode" never overlaps the card border
 *
 * Props:
 *  - data: [{ label, value }]
 *  - size: number (outer square size)
 *  - colors: string[]
 *  - explode: px distance a slice moves out on hover (default 6)
 *  - margin: extra inner padding (auto = explode + 8)
 */
export default function PieChartMini({
  data = [],
  size = 240,
  colors,
  explode = 6,
  margin, // optional
}) {
  // safe margin ensures exploded slice never hits the outer edge
  const safe = Math.max(explode + 8, margin ?? 0); // default: explode + 8px
  const cx = size / 2;
  const cy = size / 2;
  const r  = Math.max(10, size / 2 - safe);        // shrink radius by safe margin

  const total = Math.max(1, data.reduce((s, d) => s + (Number(d.value) || 0), 0));

  const palette = colors || [
    'rgb(var(--accent-1))',
    '#7C3AED',
    '#10B981',
    '#F59E0B',
    '#60A5FA',
    '#F472B6',
  ];

  const segs = useMemo(() => {
    let angle = -Math.PI / 2;
    return data.map((d, i) => {
      const val  = Number(d.value) || 0;
      const frac = val / total;
      const a0   = angle;
      const a1   = angle + frac * Math.PI * 2;
      angle = a1;

      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;

      const am  = (a0 + a1) / 2;
      const off = { x: Math.cos(am), y: Math.sin(am) };

      return {
        i,
        path,
        color: palette[i % palette.length],
        label: d.label,
        value: val,
        pct: Math.round(frac * 100),
        off,
      };
    });
  }, [data, size, colors, total, r, cx, cy]);

  const [active, setActive] = useState(null); // index
  const fmtCount = (n) => Number(n || 0).toLocaleString('en-IN');

  // radius to place tooltip toward slice center
  const tooltipR = r - 4;

  return (
    <div className="w-full">
      {/* Center the chart+legend; stack on small screens, row on larger */}
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        {/* Chart wrapper (relative so tooltip aligns perfectly) */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
            <g className="pcm-spin-in" style={{ transformOrigin: `${cx}px ${cy}px` }}>
              {segs.map((s) => (
                <g
                  key={s.i}
                  onMouseEnter={() => setActive(s.i)}
                  onMouseLeave={() => setActive(null)}
                  style={{
                    transition: 'transform 250ms ease, filter 250ms ease',
                    transform:
                      active === s.i
                        ? `translate(${s.off.x * explode}px, ${s.off.y * explode}px)`
                        : 'translate(0,0)',
                    filter: active === s.i ? 'brightness(1.05)' : 'none',
                  }}
                >
                  <path d={s.path} fill={s.color} stroke="rgb(var(--card))" strokeWidth="1.5" />
                </g>
              ))}
            </g>
          </svg>

          {/* Tooltip (referrals count, no ₹), positioned relative to the pie wrapper */}
          {active != null && (
            <div
              className="pointer-events-none absolute rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-xs shadow-md"
              style={{
                left: cx + segs[active].off.x * tooltipR,
                top:  cy + segs[active].off.y * tooltipR,
                transform: 'translate(-50%, -120%)',
                minWidth: 120,
              }}
            >
              <div className="font-medium">{segs[active].label}</div>
              <div className="opacity-70">
                referrals : <span className="font-semibold">{fmtCount(segs[active].value)}</span> ({segs[active].pct}%)
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-1 content-start gap-2 text-sm">
          {segs.map((s) => (
            <div key={s.i} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} />
              <span className="opacity-80">{s.label}:</span>
              <span className="font-medium">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        /* spin the pie once on mount */
        @keyframes pcm-spin { from { transform: rotate(-360deg); } to { transform: rotate(0deg); } }
        .pcm-spin-in { animation: pcm-spin 800ms cubic-bezier(.22,1,.36,1); }
      `}</style>
    </div>
  );
}
