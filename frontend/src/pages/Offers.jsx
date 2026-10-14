import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Img from "../components/Img";
import { apiFetch } from "../api";
import { offerRules, offerImage, appliesTag, isRoomOffer, isFoodOffer, isOnlineOffer } from "../offers";

const u = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const FILTERS = [["ALL", "All offers"], ["ROOMS", "Room stays"], ["FOOD", "Restaurant & food"]];
const forRooms = isRoomOffer;
const forFood = isFoodOffer;

// days left until the offer ends (null = no end date)
const daysLeft = (o) => {
  if (!o.validTo) return null;
  const end = new Date(o.validTo + "T23:59:59");
  return Math.max(0, Math.ceil((end - new Date()) / 86400000));
};
const startsLater = (o) => o.validFrom && new Date(o.validFrom + "T00:00:00") > new Date();
const usesLeft = (o) => (o.usageLimit ? Math.max(0, o.usageLimit - (o.usedCount || 0)) : null);

function Ends({ o }) {
  if (startsLater(o)) {
    return <span className="text-xs font-semibold text-sky-700">Starts {new Date(o.validFrom + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>;
  }
  const d = daysLeft(o);
  if (d === null) return <span className="text-xs text-gray-500">No end date</span>;
  if (d <= 7) return <span className="text-xs font-bold text-red-600">⏳ {d === 0 ? "Ends today" : `Ends in ${d} day${d > 1 ? "s" : ""}`}</span>;
  return <span className="text-xs text-gray-500">Valid till {new Date(o.validTo + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>;
}

function CodeChip({ code, copied, onCopy }) {
  if (!code) return null;
  return (
    <button type="button" onClick={() => onCopy(code)} title="Copy code"
      className="group inline-flex items-center gap-2 border-2 border-dashed border-[#B8893C] bg-[#FBF6EC] text-[#1F3B2D] font-mono font-bold tracking-wider px-3 py-1.5 rounded-md">
      {copied === code ? "COPIED ✓" : code}
      <span className="text-[10px] font-sans font-semibold text-[#B8893C] group-hover:underline">{copied === code ? "" : "COPY"}</span>
    </button>
  );
}

function Cta({ o, onBookNow, big = false }) {
  const cls = `bg-[#1F3B2D] hover:bg-[#2C5240] text-white font-semibold rounded-md ${big ? "px-6 py-3" : "text-sm px-4 py-2"}`;
  if (forRooms(o)) return <button type="button" onClick={() => onBookNow?.("", o.code || "")} className={cls}>Book a room</button>;
  if (isOnlineOffer(o)) return <Link to="/restaurant" className={cls}>Order food</Link>;
  // restaurant only: shown at the billing desk
  return <Link to="/restaurant" className={cls}>View menu</Link>;
}

// Offers from the dashboard (super admin -> Offers). The best one is applied automatically at booking / ordering.
export default function Offers({ onBookNow }) {
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    apiFetch("/api/offers?activeOnly=true")
      .then((d) => setOffers((d || []).filter((o) => usesLeft(o) !== 0).sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))))
      .catch((e) => setError(e.message));
  }, []);

  const copy = (code) => {
    try { navigator.clipboard.writeText(code); } catch { /* clipboard blocked */ }
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const shown = (offers || []).filter((o) => filter === "ALL" || (filter === "ROOMS" ? forRooms(o) : forFood(o)));
  const [featured, ...rest] = shown;
  const best = (offers || []).reduce((m, o) => Math.max(m, o.discountPercent || 0), 0);

  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="Offers & Packages"
        subtitle={best ? `Save up to ${best}% on your stay and meals. The best offer is applied automatically when you book.` : "Seasonal savings on stays and meals at Hotel Shivar."}
        image={u("photo-1566073771259-6a8506099945", 1600)}
      />

      {/* how it works */}
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <ol className="grid gap-3 md:grid-cols-3 bg-white rounded-xl shadow-md p-4 md:p-6">
          {[
            ["1", "Pick your dates", "Choose a room, or add food to your cart."],
            ["2", "We find the best offer", "The biggest discount that fits is applied automatically - or type a code below."],
            ["3", "See it on your bill", "Your confirmation and bill show “Offer applied” and how much you saved."],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-3 items-start">
              <span className="shrink-0 w-8 h-8 rounded-full bg-[#B8893C] text-white font-bold flex items-center justify-center">{n}</span>
              <div>
                <p className="font-semibold text-[#1F3B2D]">{t}</p>
                <p className="text-sm text-gray-600">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-10 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="font-serif text-3xl text-[#1F3B2D]">Current offers</h2>
          <div className="flex rounded-full border bg-white p-1 text-sm font-semibold" role="tablist">
            {FILTERS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                className={`px-4 py-1.5 rounded-full ${filter === id ? "bg-[#1F3B2D] text-white" : "text-gray-600"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-center text-red-700">{error}</p>}
        {offers === null && !error && <p className="text-center text-gray-500">Loading offers...</p>}
        {offers && shown.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center">
            <p className="text-4xl">🏷️</p>
            <p className="font-semibold text-[#1F3B2D] mt-2">No {filter === "FOOD" ? "food " : filter === "ROOMS" ? "room " : ""}offers right now</p>
            <p className="text-sm text-gray-500">New seasonal offers are added often - please check again soon.</p>
          </div>
        )}

        {/* featured: the biggest discount */}
        {featured && (
          <article className="bg-white rounded-2xl overflow-hidden shadow-sm grid md:grid-cols-2 mb-8">
            <div className="relative min-h-[220px]">
              <Img src={offerImage(featured)} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute top-4 left-4 bg-[#1F3B2D] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Featured offer</span>
            </div>
            <div className="p-6 md:p-10 flex flex-col">
              <p className="font-serif text-5xl text-[#B8893C] leading-none">{featured.discountPercent}% <span className="text-2xl">OFF</span></p>
              <h3 className="font-serif text-3xl text-[#1F3B2D] mt-3">{featured.title}</h3>
              {featured.description && <p className="text-gray-700 mt-3">{featured.description}</p>}
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {offerRules(featured).map((r) => (
                  <li key={r} className="text-xs px-2.5 py-1 rounded-full bg-[#F3F5F1] text-[#1F3B2D]">{r}</li>
                ))}
              </ul>
              <div className="mt-auto pt-6 flex flex-wrap items-center gap-3 justify-between">
                <div className="space-y-1">
                  <CodeChip code={featured.code} copied={copied} onCopy={copy} />
                  <div><Ends o={featured} /></div>
                </div>
                <Cta o={featured} onBookNow={onBookNow} big />
              </div>
            </div>
          </article>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((o) => {
            const left = usesLeft(o);
            return (
              <article key={o.id} className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="relative">
                  <Img src={offerImage(o)} alt={o.title} className="h-44 w-full object-cover" />
                  <span className="absolute top-3 left-3 bg-[#B8893C] text-white font-bold px-3 py-1 rounded-md shadow">{o.discountPercent}% OFF</span>
                  <span className="absolute top-3 right-3 bg-white/90 text-[#1F3B2D] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {appliesTag(o)}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-serif text-2xl text-[#1F3B2D]">{o.title}</h3>
                  {o.description && <p className="text-sm text-gray-700 mt-2 line-clamp-3">{o.description}</p>}
                  <ul className="mt-3 flex flex-wrap gap-1.5 flex-1 content-start">
                    {offerRules(o).slice(1).map((r) => (
                      <li key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F5F1] text-[#1F3B2D] h-fit">{r}</li>
                    ))}
                  </ul>
                  {!forRooms(o) && !isOnlineOffer(o) && <p className="text-xs text-[#1F3B2D] mt-2">🍽️ Dining in? Show this code at the billing desk.</p>}
                  {left !== null && left <= 10 && <p className="text-xs font-semibold text-red-600 mt-2">Only {left} left</p>}
                  <div className="mt-4 pt-4 border-t border-dashed flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <CodeChip code={o.code} copied={copied} onCopy={copy} />
                      <div><Ends o={o} /></div>
                    </div>
                    <Cta o={o} onBookNow={onBookNow} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <details className="mt-10 bg-white rounded-xl p-5 text-sm text-gray-600">
          <summary className="font-semibold text-[#1F3B2D] cursor-pointer">Terms & conditions</summary>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Dining at our restaurant? Show the offer code at the billing desk before your bill is printed.</li>
            <li>One offer per booking or order. If more than one fits, the biggest discount is applied automatically.</li>
            <li>The discount is taken off before GST; GST is charged on the amount after the discount.</li>
            <li>Room offers depend on the dates, number of nights and check-in day shown on each offer.</li>
            <li>Offers are valid while stocks last and can change or end without notice. They have no cash value.</li>
            <li>The offer applied is shown on your booking confirmation, your tracking page and your bill.</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
