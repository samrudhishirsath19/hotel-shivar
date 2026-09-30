import { ONLINE_STEPS } from "../orderStatus";

// Placed -> Confirmed -> Preparing -> Ready -> Out for Delivery -> Delivered, with the current step highlighted.
export default function OrderStepper({ status, compact = false }) {
  if (status === "CANCELLED") {
    return <p className="rounded-lg bg-gray-100 text-gray-700 text-sm font-bold px-3 py-2">❌ Order cancelled</p>;
  }
  const at = ONLINE_STEPS.findIndex((s) => s.id === status);
  return (
    <ol className="flex items-start w-full" aria-label="Order progress">
      {ONLINE_STEPS.map((s, i) => {
        const done = i <= at;
        const current = i === at;
        return (
          <li key={s.id} className="flex-1 flex flex-col items-center relative min-w-0" aria-current={current ? "step" : undefined}>
            {i > 0 && (
              <span className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-0 ${i <= at ? "bg-green-500" : "bg-gray-200"}`} aria-hidden="true" />
            )}
            <span
              className={`relative z-10 flex items-center justify-center rounded-full border-2 ${compact ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm"} ${
                current ? "bg-green-600 border-green-600 text-white ring-4 ring-green-100" : done ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 text-gray-400"
              }`}
            >
              {done && !current ? "✓" : s.icon}
            </span>
            <span className={`mt-1 text-center leading-tight ${compact ? "text-[9px]" : "text-[11px]"} ${current ? "font-bold text-green-700" : done ? "text-gray-700" : "text-gray-400"}`}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
