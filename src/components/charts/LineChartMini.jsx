import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * LineChartMini
 * Props (all optional):
 * - points: [{ month, value }]
 * - height: number
 * - stroke: css color
 * - fontSize: base tick font size (default 12)
 * - yAxisWidth: reserved space for left labels (default 44)
 * - yAxisGap: extra gap between labels and plot line (default 10)
 */
export default function LineChartMini({
  points = [],
  height = 200,
  stroke = 'rgb(var(--accent-1))',
  fontSize = 12,
  yAxisWidth = 44,
  yAxisGap = 10,
}) {
  const w = 560; // logical width
  const h = Math.max(160, height);

  // padding: bigger left pad for label width + a little extra gap so line doesn't crowd the text
  const padL = yAxisWidth + yAxisGap; // ⬅️ increased left space
  const padR = 16, padT = 16, padB = 30;

  const svgRef = useRef(null);
  const pathRef = useRef(null);

  const hasMulti = points.length > 1;

  // "nice" max for ticks
  const maxVal = useMemo(() => {
    const raw = Math.max(...points.map(p => Number(p.value) || 0), 0);
    if (raw <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return niceNorm * mag;
  }, [points]);

  const stepX = (w - padL - padR) / Math.max(1, points.length - 1);

  const toXY = (v, i) => {
    const x = padL + i * stepX;
    const y = h - padB - (Number(v || 0) / maxVal) * (h - padT - padB);
    return [x, y];
  };

  const d = useMemo(() => {
    if (!hasMulti) return '';
    return points.map((p, i) => {
      const [x, y] = toXY(p.value, i);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [points, maxVal]);

  // tooltip
  const [hover, setHover] = useState(null); // {i, x, y}

  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let i = 0, best = Infinity;
    for (let idx = 0; idx < points.length; idx++) {
      const [x] = toXY(points[idx].value, idx);
      const dx = Math.abs(x - mx);
      if (dx < best) { best = dx; i = idx; }
    }
    const [x, y] = toXY(points[i].value, i);
    setHover({ i, x, y });
  };

  const onLeave = () => setHover(null);

  // draw animation
  useEffect(() => {
    const p = pathRef.current;
    if (p && hasMulti) {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      p.getBoundingClientRect();
      p.style.transition = 'stroke-dashoffset 800ms cubic-bezier(.22,1,.36,1)';
      p.style.strokeDashoffset = '0';
    }
  }, [d, hasMulti]);

  // y ticks (values)
  const ticks = useMemo(() => {
    const count = 4;
    const arr = [];
    for (let i = 0; i <= count; i++) {
      const v = (maxVal / count) * i;
      const y = h - padB - (v / maxVal) * (h - padT - padB);
      arr.push({ v, y });
    }
    return arr;
  }, [maxVal, h]);

  if (!points?.length) return <div className="text-sm opacity-60">No data</div>;

  const fmtINR = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(Number(n || 0));

  const fsY = fontSize;         // y-axis label font
  const fsX = Math.max(11, fontSize - 1); // x-axis month font (slightly smaller to avoid crowding)
  const yLabelX = 8;            // left margin for y labels

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto select-none"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {/* grid + Y labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={t.y}
              x2={w - padR}
              y2={t.y}
              stroke="rgb(var(--border))"
              strokeDasharray="4 4"
            />
            <text
              x={yLabelX}
              y={t.y + fsY * 0.35}
              fontSize={fsY}
              fill="rgb(var(--fg))"
              opacity="0.7"
            >
              {Math.round(t.v).toLocaleString('en-IN')}
            </text>
          </g>
        ))}

        {/* X labels */}
        {points.map((p, i) => {
          const [x] = toXY(0, i);
          return (
            <text
              key={i}
              x={x}
              y={h - 6}
              textAnchor="middle"
              fontSize={fsX}
              fill="rgb(var(--fg))"
              opacity="0.8"
            >
              {p.month}
            </text>
          );
        })}

        {/* line path */}
        {hasMulti && (
          <path ref={pathRef} d={d} fill="none" stroke={stroke} strokeWidth="3" />
        )}

        {/* dots (rise in) */}
        {points.map((p, i) => {
          const [x, y] = toXY(p.value, i);
          const delay = 100 + i * 50;
          return (
            <g
              key={i}
              style={{
                opacity: 0,
                transform: 'translateY(10px)',
                animation: `lcm-pop 500ms ${delay}ms forwards cubic-bezier(.22,1,.36,1)`,
              }}
            >
              <circle cx={x} cy={y} r="4.5" fill={stroke} />
              {hover?.i === i && (
                <circle cx={x} cy={y} r="8" fill="none" stroke={stroke} strokeOpacity="0.35" />
              )}
            </g>
          );
        })}

        {/* hover guide line */}
        {hover && <line x1={hover.x} y1={padT} x2={hover.x} y2={h - padB} stroke="rgb(var(--border))" />}

        {/* overlay for pointer capture */}
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
      </svg>

      {/* tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-xs shadow-md"
          style={{
            left: `calc(${(hover.x / w) * 100}% - 60px)`,
            top: Math.max(0, (hover.y / h) * 100) + '%',
            transform: 'translateY(-110%)',
            minWidth: 120,
          }}
        >
          <div className="font-medium">{points[hover.i]?.month}</div>
          <div className="opacity-70">
            revenue : <span className="font-semibold">{fmtINR(points[hover.i]?.value)}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lcm-pop { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
