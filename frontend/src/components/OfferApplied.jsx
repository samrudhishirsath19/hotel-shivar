import { inr2 } from "../gst";

// "Offer applied" banner for a saved booking / order that got an offer discount (nothing when it did not).
export default function OfferApplied({ x, className = "" }) {
  if (!x || !(Number(x.discountAmount) > 0)) return null;
  return (
    <div className={`flex items-center gap-3 text-left rounded-xl border-2 border-dashed border-green-600 bg-green-50 px-4 py-3 ${className}`}>
      <span className="text-2xl" aria-hidden="true">🏷️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-green-800">Offer applied{x.offerTitle ? `: ${x.offerTitle}` : ""}</p>
        <p className="text-xs text-green-700">
          Code <b className="font-mono">{x.offerCode}</b> · you saved <b>{inr2(x.discountAmount)}</b>
        </p>
      </div>
    </div>
  );
}
