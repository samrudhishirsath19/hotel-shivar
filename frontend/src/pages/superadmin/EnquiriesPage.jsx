import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { fmtDateTime } from "../../dates";
import { PageTitle, Notice } from "./ui";

const TABS = [
  ["contact", "Contact messages", "/api/contact"],
  ["banquet", "Banquet enquiries", "/api/banquet"],
];

// Enquiries sent from the website (Contact page and Banquet page). Staff with "Enquiries" access.
export default function EnquiriesPage() {
  const [tab, setTab] = useState("contact");
  const [data, setData] = useState({ contact: null, banquet: null });
  const [showDone, setShowDone] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    Promise.all(TABS.map(([, , url]) => apiFetch(url)))
      .then(([contact, banquet]) => { setData({ contact: contact || [], banquet: banquet || [] }); setError(""); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const mark = async (id, resolved) => {
    const url = TABS.find(([k]) => k === tab)[2];
    try {
      await apiFetch(`${url}/${id}/resolved?resolved=${resolved}`, { method: "PATCH" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const list = (data[tab] || []).filter((x) => showDone || !x.resolved)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const open = (k) => (data[k] || []).filter((x) => !x.resolved).length;

  return (
    <div>
      <PageTitle title="Enquiries" sub="Messages from the website's Contact and Banquet pages. Mark them done once you have replied." />
      <Notice error={error} />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tab === k ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white"}`}>
            {label} {data[k] && <span className={`ml-1 text-xs px-1.5 rounded-full ${tab === k ? "bg-white/20" : "bg-amber-100 text-amber-800"}`}>{open(k)}</span>}
          </button>
        ))}
        <label className="ml-auto text-sm flex items-center gap-2">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show done
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {data[tab] === null && <p className="text-sm text-gray-500">Loading...</p>}
        {data[tab] && list.length === 0 && <p className="text-sm text-gray-500 bg-white border rounded-xl p-4">No {showDone ? "" : "open "}enquiries.</p>}
        {list.map((x) => (
          <article key={x.id} className={`bg-white border rounded-xl p-4 ${x.resolved ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{x.name} {tab === "contact" && x.subject && <span className="font-normal text-gray-500">· {x.subject}</span>}</p>
                <p className="text-sm text-gray-600">
                  <a href={`mailto:${x.email}`} className="underline">{x.email}</a>
                  {x.phone && <> · <a href={`tel:${x.phone}`} className="underline">{x.phone}</a></>}
                </p>
                {tab === "banquet" && (
                  <p className="text-sm text-gray-700 mt-1">
                    {x.eventType || "Event"}{x.eventDate ? ` on ${x.eventDate}` : ""}{x.guestCount ? ` · ${x.guestCount} guests` : ""}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{fmtDateTime(x.createdAt)}</p>
                <button onClick={() => mark(x.id, !x.resolved)}
                  className={`mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${x.resolved ? "border" : "bg-[#1F3B2D] text-white"}`}>
                  {x.resolved ? "Reopen" : "Mark done"}
                </button>
              </div>
            </div>
            {x.message && <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{x.message}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
