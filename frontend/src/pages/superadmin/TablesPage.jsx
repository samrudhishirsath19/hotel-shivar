<<<<<<< HEAD
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useBoard from "./useBoard";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { canSee, can } from "../../roles";
import { usePanel } from "./panelContext";
import { PageTitle, Notice, inputCls } from "./ui";
import { Ticket, Toast } from "./Ticket";

const STATUSES = [
  { id: "AVAILABLE", label: "Available", cls: "bg-green-100 text-green-700" },
  { id: "RESERVED", label: "Reserved", cls: "bg-yellow-100 text-yellow-800" },
  { id: "OUT_OF_SERVICE", label: "Out of service", cls: "bg-gray-200 text-gray-600" },
];
const statusOf = (id) => STATUSES.find((s) => s.id === id) || { label: id, cls: "bg-gray-100 text-gray-600" };
const blank = { tableNumber: "", capacity: "4", status: "AVAILABLE" };

// Super admin: add / edit / delete tables (number, seats, status).
// setup = add / edit / delete tables; statusOnly users can only change the status
function ManageTables({ onChanged, setup }) {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/api/admin/tables").then((d) => setTables(d || [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (t) => { setOk(t); setTimeout(() => setOk(""), 3000); };
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const reset = () => { setForm(blank); setEditingId(null); };
  const changed = () => { load(); onChanged(); };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const number = Number(form.tableNumber);
    if (!Number.isInteger(number) || number < 1) { setError("Enter a table number of 1 or more"); return; }
    if (tables.some((t) => t.tableNumber === number && t.id !== editingId)) { setError(`Table ${number} already exists`); return; }
    setSaving(true);
    try {
      await apiFetch(editingId ? `/api/admin/tables/${editingId}` : "/api/admin/tables", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({ tableNumber: number, capacity: Number(form.capacity), status: form.status }),
      });
      flash(editingId ? `✅ Table ${number} updated` : `✅ Table ${number} added`);
      reset();
      changed();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (t) => {
    setEditingId(t.id);
    setForm({ tableNumber: String(t.tableNumber), capacity: String(t.capacity), status: t.status });
    setError("");
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete table ${t.tableNumber}?`)) return;
    try {
      await apiFetch(`/api/admin/tables/${t.id}`, { method: "DELETE" });
      flash(`Table ${t.tableNumber} deleted`);
      if (editingId === t.id) reset();
      changed();
    } catch (err) {
      setError(err.message);
    }
  };

  const quickStatus = async (t, status) => {
    try {
      await apiFetch(`/api/admin/tables/${t.id}/status?status=${status}`, { method: "PATCH" });
      changed();
    } catch (err) {
      setError(err.message);
    }
  };

  const seats = tables.reduce((s, t) => s + (t.status === "OUT_OF_SERVICE" ? 0 : t.capacity), 0);

  return (
    <section className="mb-8">
      {!setup && <p className="mb-3 text-sm text-gray-600">You can change each table's status below. Adding or editing tables needs the “Tables set-up” permission.</p>}
      {error && !setup && <p role="alert" className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</p>}
      {setup && (
      <form onSubmit={save} className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900">{editingId ? `Edit table ${tables.find((t) => t.id === editingId)?.tableNumber ?? ""}` : "Add a table"}</h3>
        <Notice error={error} ok={ok} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          <div>
            <label className="text-xs font-semibold" htmlFor="tb-no">Table number</label>
            <input id="tb-no" required type="number" min="1" value={form.tableNumber} onChange={set("tableNumber")} placeholder="e.g. 6" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="tb-cap">Capacity (seats)</label>
            <input id="tb-cap" required type="number" min="1" max="50" value={form.capacity} onChange={set("capacity")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="tb-st">Status</label>
            <select id="tb-st" value={form.status} onChange={set("status")} className={inputCls + " bg-white"}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={saving} className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save changes" : "Add table"}
          </button>
          {editingId && <button type="button" onClick={reset} className="px-5 py-2 rounded-full bg-gray-100 text-sm font-bold">Cancel edit</button>}
        </div>
      </form>
      )}

      <h3 className="mt-6 font-bold text-gray-900">All tables ({tables.length}) · {seats} seats in use</h3>
      <div className="mt-3 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Table</th><th className="p-3">Capacity</th><th className="p-3">Status</th>{setup && <th className="p-3">Actions</th>}</tr>
          </thead>
          <tbody>
            {tables.length === 0 && <tr><td colSpan={setup ? 4 : 3} className="p-6 text-center text-gray-400">No tables yet - add the first one above</td></tr>}
            {tables.map((t) => (
              <tr key={t.id} className={`border-b last:border-0 ${editingId === t.id ? "bg-yellow-50" : ""}`}>
                <td className="p-3 font-semibold">Table {t.tableNumber}</td>
                <td className="p-3">{t.capacity} seats</td>
                <td className="p-3">
                  <select value={t.status} onChange={(e) => quickStatus(t, e.target.value)} aria-label={`Status of table ${t.tableNumber}`}
                    className={`text-xs font-bold rounded-full px-2 py-1 border-0 ${statusOf(t.status).cls}`}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </td>
                {setup && <td className="p-3 whitespace-nowrap">
                  {setup && <>
                  <button onClick={() => edit(t)} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={() => remove(t)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
                  </>}
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">“Occupied” is automatic while a table has a running order. A table with a running order cannot be deleted or renumbered. Out-of-service tables cannot take new orders.</p>
    </section>
  );
}

export default function TablesPage() {
  const { board, error, msg, reload } = useBoard();
  const { user } = useAuth();
  const { base } = usePanel();
  const hasBilling = canSee(user?.role, "billing");
  const tableSetup = can(user?.role, "TABLE_SETUP");
  const tableStatus = can(user?.role, "TABLE_STATUS");
  const manageTables = tableSetup || tableStatus;
  const [manage, setManage] = useState(false);
=======
import { Link } from "react-router-dom";
import useBoard from "./useBoard";
import { useAuth } from "../../context/AuthContext";
import { canSee } from "../../roles";
import { usePanel } from "./panelContext";
import { PageTitle } from "./ui";
import { Ticket, Toast } from "./Ticket";

export default function TablesPage() {
  const { board, error, msg } = useBoard();
<<<<<<< Updated upstream
=======
  const { user } = useAuth();
  const { base } = usePanel();
  const hasBilling = canSee(user?.role, "billing");
>>>>>>> Stashed changes
>>>>>>> origin/sakshi
  const tables = board?.tables || [];
  const occupied = tables.filter((t) => t.order).length;

  return (
    <div>
      <Toast msg={msg} />
<<<<<<< HEAD
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Tables" sub={board ? `${occupied} of ${tables.length} tables occupied` : "Loading..."} />
        {manageTables && (
          <button onClick={() => setManage((m) => !m)} className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">
            {manage ? "Close table settings" : tableSetup ? "⚙️ Manage tables" : "⚙️ Table status"}
          </button>
        )}
      </div>
      {manageTables && manage && <ManageTables onChanged={reload} setup={tableSetup} />}
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tables.map((t) => {
          const seats = t.capacity ? `${t.capacity} seats` : "";
          if (t.order) {
            return (
              <Ticket key={t.number} title={`Table ${t.number}`} sub={[`KOT #${t.order.id}`, seats].filter(Boolean).join(" · ")} badge="OCCUPIED" order={t.order}>
                {hasBilling && <Link to={`${base}/billing`} className="flex-1 text-center py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Open bill in Billing →</Link>}
              </Ticket>
            );
          }
          const st = statusOf(t.status || "AVAILABLE");
          const border = t.status === "RESERVED" ? "border-yellow-200" : t.status === "OUT_OF_SERVICE" ? "border-gray-200 opacity-70" : "border-green-200";
          return (
            <div key={t.number} className={`bg-white rounded-xl border-2 p-4 ${border}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">Table {t.number}</h3>
                  {seats && <p className="text-xs text-gray-500">👥 {seats}</p>}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${st.cls}`}>{st.label}</span>
              </div>
              <p className="text-xs text-gray-400 mt-6 text-center">
                {t.status === "OUT_OF_SERVICE" ? "Not taking orders" : t.status === "RESERVED" ? "Reserved - no orders yet" : "No orders yet"}
              </p>
            </div>
          );
        })}
=======
      <PageTitle title="Tables" sub={board ? `${occupied} of ${tables.length} tables occupied` : "Loading..."} />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tables.map((t) =>
          t.order ? (
            <Ticket key={t.number} title={`Table ${t.number}`} sub={`KOT #${t.order.id}`} badge="OCCUPIED" order={t.order}>
<<<<<<< Updated upstream
              <Link to="/super-admin/billing" className="flex-1 text-center py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Open bill in Billing →</Link>
=======
              {hasBilling && <Link to={`${base}/billing`} className="flex-1 text-center py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Open bill in Billing →</Link>}
>>>>>>> Stashed changes
            </Ticket>
          ) : (
            <div key={t.number} className="bg-white rounded-xl border-2 border-green-200 p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900">Table {t.number}</h3>
                <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-100 text-green-700">AVAILABLE</span>
              </div>
              <p className="text-xs text-gray-400 mt-8 text-center">No orders yet</p>
            </div>
          )
        )}
>>>>>>> origin/sakshi
      </div>
    </div>
  );
}
