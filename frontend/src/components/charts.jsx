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
export function LineChart({ labels, series, height = 260, maxHeight }) {
  const all = series.flatMap((s) => s.values);
  if (labels.length === 0 || all.every((v) => !v)) return <EmptyChart />;
  const g = geometry(labels, series, height);
  const xAt = (i) => g.ml + (labels.length === 1 ? g.iw / 2 : (i * g.iw) / (labels.length - 1));
  return (
    <div>
      <svg viewBox={`0 0 ${g.W} ${height}`} className="w-full h-auto" style={maxHeight ? { maxHeight } : undefined} role="img">
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
      <Legend series={series} />
    </div>
  );
}

// grouped vertical bars
export function BarChart({ labels, series, height = 260 }) {
  const all = series.flatMap((s) => s.values);
  if (labels.length === 0 || all.every((v) => !v)) return <EmptyChart />;
  const g = geometry(labels, series, height);
  const band = g.iw / labels.length;
  const barW = Math.min(28, (band * 0.8) / series.length);
  const xAt = (i) => g.ml + i * band + band / 2;
  return (
    <div>
      <svg viewBox={`0 0 ${g.W} ${height}`} className="w-full h-auto" role="img">
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
      {series.length > 1 && <Legend series={series} />}
    </div>
  );
}

// slices = [{ label, value, color }]
export function Donut({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return <EmptyChart />;
  const r = 60, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="w-44 h-44" role="img">
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
      <div className="mt-2 space-y-1 text-xs text-gray-600">
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
