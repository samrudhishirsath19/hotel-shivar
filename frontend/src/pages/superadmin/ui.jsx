export const inputCls =
  "mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8893C]";

export function PageTitle({ title, sub }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Notice({ error, ok }) {
  return (
    <>
      {error && <p role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</p>}
      {ok && <p className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">{ok}</p>}
    </>
  );
}

export function Badge({ on, yes, no }) {
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
      {on ? yes : no}
    </span>
  );
}

// On/off switch (keyboard and screen-reader friendly)
export function Switch({ on, onChange, label, disabled = false, size = "md" }) {
  const big = size === "lg";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8893C] focus-visible:ring-offset-2 disabled:opacity-40 ${
        big ? "h-7 w-12" : "h-5 w-9"
      } ${on ? "bg-[#1F3B2D]" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow transition-transform ${big ? "h-5 w-5" : "h-3.5 w-3.5"} ${
          on ? (big ? "translate-x-6" : "translate-x-[18px]") : "translate-x-1"
        }`}
      />
    </button>
  );
}
