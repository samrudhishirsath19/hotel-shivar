// Small dependency-free SVG charts (no chart library to install).
import { inr } from "../roles";

export const COLORS = { food: "#1F3B2D", rooms: "#B8893C", total: "#2563eb" };

const dayLabel = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const niceMax = (v) => {
  if (!v || v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
};

const short = (n) => {
  if (n >= 100000) return (n / 100000).toFixed(n % 100000 ? 1 : 0) + "L";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 ? 1 : 0) + "k";
  return String(Math.round(n));
};

export function EmptyChart({ text = "No sales in this period" }) {
  return <div className="h-40 flex items-center justify-center text-sm text-gray-400">{text}</div>;
}

function Legend({ series }) {
  return (
    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
      {series.map((s) => (
        <span key={s.name} className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

// shared axes + grid. Returns the svg pieces and a y() function.
function geometry(labels, series, height) {
  const W = 640, ml = 52, mr = 14, mt = 14, mb = 30;
  const iw = W - ml - mr, ih = height - mt - mb;
  const maxVal = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const y = (v) => mt + ih - (v / maxVal) * ih;
  const step = Math.max(1, Math.ceil(labels.length / 8));
  return { W, ml, mr, mt, mb, iw, ih, maxVal, y, step };
}

function Axes({ g, labels, xAt, height }) {
  const ticks = [0, 1, 2, 3, 4].map((i) => (g.maxVal / 4) * i);
  return (
    <>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={g.ml} x2={g.W - g.mr} y1={g.y(t)} y2={g.y(t)} stroke="#e5e7eb" />
          <text x={g.ml - 6} y={g.y(t) + 3} textAnchor="end" fontSize="10" fill="#6b7280">{short(t)}</text>
        </g>
      ))}
      {labels.map((l, i) =>
        i % g.step === 0 ? (
          <text key={l} x={xAt(i)} y={height - 10} textAnchor="middle" fontSize="10" fill="#6b7280">{dayLabel(l)}</text>
        ) : null
      )}
    </>
  );
}

// series = [{ name, color, values: [numbers, same length as labels] }]
<<<<<<< HEAD
// fit = fill the height of the parent (parent must have a height) instead of using the width-based height
export function LineChart({ labels, series, height = 260, maxHeight, fit = false }) {
=======
<<<<<<< Updated upstream
export function LineChart({ labels, series, height = 260, maxHeight }) {
=======
// fit = fill the height of the parent (parent must have a height) instead of using the width-based height
export function LineChart({ labels, series, height = 260, maxHeight, fit = false }) {
>>>>>>> Stashed changes
>>>>>>> origin/sakshi
  const all = series.flatMap((s) => s.values);
  if (labels.length === 0 || all.every((v) => !v)) return <EmptyChart />;
  const g = geometry(labels, series, height);
  const xAt = (i) => g.ml + (labels.length === 1 ? g.iw / 2 : (i * g.iw) / (labels.length - 1));
  return (
<<<<<<< HEAD
=======
<<<<<<< Updated upstream
    <div>
      <svg viewBox={`0 0 ${g.W} ${height}`} className="w-full h-auto" style={maxHeight ? { maxHeight } : undefined} role="img">
=======
>>>>>>> origin/sakshi
    <div className={fit ? "h-full flex flex-col" : ""}>
      <div className={fit ? "relative flex-1 min-h-0" : ""}>
      <svg
        viewBox={`0 0 ${g.W} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className={fit ? "absolute inset-0 w-full h-full" : "w-full h-auto"}
        style={!fit && maxHeight ? { maxHeight } : undefined}
        role="img"
      >
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> origin/sakshi
        <Axes g={g} labels={labels} xAt={xAt} height={height} />
        {series.map((s) => (
          <g key={s.name}>
            <path
              d={s.values.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${g.y(v)}`).join(" ")}
              fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round"
            />
            {labels.length <= 31 && s.values.map((v, i) => (
              <circle key={i} cx={xAt(i)} cy={g.y(v)} r="3.5" fill={s.color}>
                <title>{`${s.name} - ${dayLabel(labels[i])}: ${inr(v)}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      </div>
      <Legend series={series} />
    </div>
  );
}

// grouped vertical bars
export function BarChart({ labels, series, height = 260, fit = false }) {
  const all = series.flatMap((s) => s.values);
  if (labels.length === 0 || all.every((v) => !v)) return <EmptyChart />;
  const g = geometry(labels, series, height);
  const band = g.iw / labels.length;
  const barW = Math.min(28, (band * 0.8) / series.length);
  const xAt = (i) => g.ml + i * band + band / 2;
  return (
    <div className={fit ? "h-full flex flex-col" : ""}>
      <div className={fit ? "relative flex-1 min-h-0" : ""}>
      <svg
        viewBox={`0 0 ${g.W} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className={fit ? "absolute inset-0 w-full h-full" : "w-full h-auto"}
        role="img"
      >
        <Axes g={g} labels={labels} xAt={xAt} height={height} />
        {labels.map((l, i) =>
          series.map((s, k) => {
            const v = s.values[i];
            const x = xAt(i) - (barW * series.length) / 2 + k * barW;
            return (
              <rect key={l + s.name} x={x} y={g.y(v)} width={barW - 1} height={Math.max(0, g.y(0) - g.y(v))} fill={s.color} rx="2">
                <title>{`${s.name} - ${dayLabel(l)}: ${inr(v)}`}</title>
              </rect>
            );
          })
        )}
      </svg>
      </div>
      {series.length > 1 && <Legend series={series} />}
    </div>
  );
}

// slices = [{ label, value, color }]
export function Donut({ slices, compact = false }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return <EmptyChart />;
  const r = 60, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 160" className={compact ? "w-32 h-32" : "w-44 h-44"} role="img">
        <g transform="rotate(-90 80 80)">
          {slices.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle key={s.label} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="26"
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}>
                <title>{`${s.label}: ${inr(s.value)}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" fontSize="10" fill="#6b7280">Total</text>
        <text x="80" y="94" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1F3B2D">{inr(total)}</text>
      </svg>
      <div className={`${compact ? "mt-1" : "mt-2"} space-y-1 text-xs text-gray-600`}>
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} />
            {s.label}: <b>{inr(s.value)}</b> ({Math.round((s.value / total) * 100)}%)
          </div>
        ))}
      </div>
    </div>
  );
}

// rows = [{ label, value, note }]  -> horizontal bars, value shown in rupees
export function HBar({ rows, color = COLORS.food, empty = "No sales in this period" }) {
  if (rows.length === 0 || rows.every((r) => !r.value)) return <EmptyChart text={empty} />;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-xs mb-0.5 gap-2">
            <span className="truncate font-medium text-gray-700">{r.label}</span>
            <span className="text-gray-500 whitespace-nowrap">{r.note ? r.note + " · " : ""}<b className="text-gray-800">{inr(r.value)}</b></span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Poll-style chart: every option is a full-width bar filled to its share of the total,
// with the percentage and value shown like poll results. The largest option is highlighted.
// rows = [{ label, value, color?, display? }]  (display = text shown instead of rupees)
export function PollChart({ rows, color = COLORS.food, empty = "No data yet", money = true }) {
  const total = rows.reduce((s, r) => s + (Number(r.value) || 0), 0);
  if (rows.length === 0 || total <= 0) return <EmptyChart text={empty} />;
  const top = Math.max(...rows.map((r) => Number(r.value) || 0));
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const v = Number(r.value) || 0;
        const pct = Math.round((v / total) * 100);
        const lead = v === top && v > 0;
        const c = r.color || color;
        return (
          <div key={r.label} className={`relative overflow-hidden rounded-lg border ${lead ? "border-gray-400" : "border-gray-200"}`} title={`${r.label}: ${pct}%`}>
            <div className="absolute inset-y-0 left-0 transition-all duration-500" style={{ width: `${pct}%`, background: c, opacity: lead ? 0.28 : 0.16 }} />
            <div className="relative flex items-center justify-between gap-2 px-3 py-1.5">
              <div className="min-w-0">
                <p className={`text-sm leading-snug break-words ${lead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                  {lead && <span className="mr-1">★</span>}{r.label}
                </p>
                <p className="text-[11px] text-gray-500">{r.display ?? (money ? inr(v) : v)}</p>
              </div>
              <b className="shrink-0 text-sm text-gray-900">{pct}%</b>
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-gray-400 text-right">Total: {money ? inr(total) : total}</p>
    </div>
  );
}
