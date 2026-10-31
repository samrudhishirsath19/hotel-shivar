import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { can, digits10, cleanName, isFullName, NAME_ERROR, NAME_MAX } from "../../roles";
import { fmtDateTime } from "../../dates";
import { PageTitle, Notice, Switch, inputCls } from "./ui";

const blank = { name: "", email: "", phone: "", password: "", active: true };

// Order User: delivery boy logins and how busy each one is right now.
export default function DeliveryBoysPage() {
  const { user } = useAuth();
  const manage = can(user?.role, "DELIVERY_STAFF"); // without it: view only (who is free)
  const [boys, setBoys] = useState(null);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => apiFetch("/api/admin/delivery-boys").then(setBoys).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const flash = (m) => { setOk(m); setTimeout(() => setOk(""), 3000); };
  const reset = () => { setForm(blank); setEditId(null); };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!isFullName(form.name)) { setError(NAME_ERROR); return; }
    if (!/^[6-9]\d{9}$/.test(form.phone)) { setError("Enter a valid 10-digit mobile number"); return; }
    if (!editId && form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setBusy(true);
    try {
      await apiFetch(editId ? `/api/admin/delivery-boys/${editId}` : "/api/admin/delivery-boys", {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify({ ...form, name: cleanName(form.name), email: form.email.trim() }),
      });
      flash(editId ? "Delivery boy updated" : "Delivery boy added - he can now log in with this email and password");
      reset();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (b, active) => {
    setError("");
    try {
      await apiFetch(`/api/admin/delivery-boys/${b.id}`, { method: "PUT", body: JSON.stringify({ name: b.name, email: b.email, phone: b.phone || "", active }) });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete ${b.name}'s login? Delivered orders keep his name.`)) return;
    try {
      await apiFetch(`/api/admin/delivery-boys/${b.id}`, { method: "DELETE" });
      if (editId === b.id) reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const list = boys || [];
  const on = list.filter((b) => b.active);

  return (
    <div>
      <PageTitle title="Delivery Boys" sub="Each delivery boy logs in with his own account and sees only the orders assigned to him." />
      <Notice error={error} ok={ok} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        {[
          ["Delivery boys on duty", on.length],
          ["Free now", on.filter((b) => b.activeOrders === 0).length],
          ["Orders on the way / assigned", on.reduce((s, b) => s + b.activeOrders, 0)],
          ["Delivered today", list.reduce((s, b) => s + b.deliveredToday, 0)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{boys ? value : "-"}</p>
          </div>
        ))}
      </div>

      {manage && (
        <form onSubmit={save} className="bg-white border rounded-xl p-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <h2 className="md:col-span-2 lg:col-span-4 font-bold text-gray-900">{editId ? "Edit delivery boy" : "Add a delivery boy"}</h2>
          <label className="text-sm">Full name
            <input value={form.name} onChange={set("name")} maxLength={NAME_MAX} autoComplete="off" placeholder="e.g. Raju Pawar" className={inputCls} />
          </label>
          <label className="text-sm">Mobile number
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: digits10(e.target.value) }))} inputMode="numeric" placeholder="10 digits" className={inputCls} />
          </label>
          <label className="text-sm">Login email
            <input type="email" value={form.email} onChange={set("email")} disabled={!!editId} autoComplete="off" placeholder="raju@hotelshivar.com" className={inputCls + (editId ? " bg-gray-100" : "")} />
          </label>
          <label className="text-sm">{editId ? "New password (leave empty to keep)" : "Password (8+ characters)"}
            <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" className={inputCls} />
          </label>
          <div className="md:col-span-2 lg:col-span-4 flex gap-2">
            <button disabled={busy} className="bg-[#1F3B2D] text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-60">{busy ? "Saving..." : editId ? "Save changes" : "Add delivery boy"}</button>
            {editId && <button type="button" onClick={reset} className="border px-5 py-2 rounded-lg">Cancel</button>}
          </div>
        </form>
      )}

      <div className="mt-5 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="p-3">Delivery boy</th><th className="p-3">Mobile</th><th className="p-3">Right now</th><th className="p-3">Delivered today</th><th className="p-3">Last login</th>{manage && <><th className="p-3">On duty</th><th className="p-3" /></>}</tr>
          </thead>
          <tbody>
            {boys && list.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-gray-500">No delivery boys yet{manage ? " - add the first one above" : ""}.</td></tr>}
            {list.map((b) => (
              <tr key={b.id} className={`border-t ${b.active ? "" : "opacity-60"}`}>
                <td className="p-3"><p className="font-semibold">🛵 {b.name}</p><p className="text-xs text-gray-500">{b.email}</p></td>
                <td className="p-3">{b.phone ? <a href={`tel:${b.phone}`} className="underline">{b.phone}</a> : "-"}</td>
                <td className="p-3">
                  {!b.active ? <span className="text-xs font-bold text-gray-500">Off duty</span>
                    : b.activeOrders === 0 ? <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-100 text-green-700">Free</span>
                      : <span className="text-xs px-2 py-1 rounded-full font-bold bg-blue-100 text-blue-700">{b.activeOrders} order{b.activeOrders > 1 ? "s" : ""}</span>}
                </td>
                <td className="p-3">{b.deliveredToday}</td>
                <td className="p-3 text-xs text-gray-500">{b.lastLoginAt ? fmtDateTime(b.lastLoginAt) : "Never"}</td>
                {manage && (
                  <>
                    <td className="p-3"><Switch on={b.active} onChange={(v) => toggle(b, v)} label={`${b.name} on duty`} /></td>
                    <td className="p-3 whitespace-nowrap">
                      <button onClick={() => { setEditId(b.id); setForm({ name: b.name, email: b.email, phone: b.phone || "", password: "", active: b.active }); window.scrollTo(0, 0); }}
                        className="text-[#B8893C] font-semibold mr-3">Edit</button>
                      <button onClick={() => remove(b)} className="text-red-600">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">Switching a delivery boy off duty or deleting him is only possible when he has no orders left to deliver.</p>
    </div>
  );
}
