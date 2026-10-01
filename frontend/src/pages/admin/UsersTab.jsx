import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { DEPARTMENTS, roleLabel } from "../../roles";

const blank = { name: "", email: "", password: "", role: "MANAGER", active: true };
const inputCls = "mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8893C]";

export default function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/api/admin/users").then((d) => setUsers(d || [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const flash = (t) => { setOk(t); setTimeout(() => setOk(""), 3000); };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch(editingId ? `/api/admin/users/${editingId}` : "/api/admin/users", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          active: form.active,
        }),
      });
      flash(editingId ? "✅ User updated" : "✅ User created - they can log in now");
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (u) => {
    setEditingId(u.id);
    setForm({ name: u.name || "", email: u.email, password: "", role: u.role, active: u.active });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete the login for ${u.email}?`)) return;
    try {
      await apiFetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      flash("User deleted");
      load();
    } catch (err) { setError(err.message); }
  };

  const fmt = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never");

  return (
    <div>
      <form onSubmit={save} className="bg-white border rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-[#1F3B2D]">{editingId ? "Edit user" : "Create a new login"}</h3>
        {error && <p role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</p>}
        {ok && <p className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">{ok}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
          <div>
            <label className="text-xs font-semibold">Name</label>
            <input required value={form.name} onChange={set("name")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Email (login id)</label>
            <input required type="email" disabled={!!editingId} value={form.email} onChange={set("email")} className={inputCls + " disabled:bg-gray-100"} />
          </div>
          <div>
            <label className="text-xs font-semibold">{editingId ? "New password (leave empty to keep)" : "Password (min 8 characters)"}</label>
            <input
              type="password"
              autoComplete="new-password"
              required={!editingId}
              minLength={editingId ? undefined : 8}
              value={form.password}
              onChange={set("password")}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Department</label>
            <select value={form.role} onChange={set("role")} className={inputCls + " bg-white"}>
              {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">{DEPARTMENTS.find((d) => d.value === form.role)?.help}</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={set("active")} />
              Login enabled
            </label>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={saving} className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save changes" : "Create user"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(blank); setError(""); }} className="px-5 py-2 rounded-full bg-gray-100 text-sm font-bold">Cancel edit</button>
          )}
        </div>
      </form>

      <h3 className="mt-6 font-bold text-[#1F3B2D]">All logins ({users.length})</h3>
      <div className="mt-3 bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Department</th><th className="p-3">Status</th><th className="p-3">Last login</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.email.toLowerCase() === (me?.email || "").toLowerCase();
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3 font-semibold">{u.name}{self && <span className="ml-2 text-[10px] text-gray-400">(you)</span>}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{roleLabel(u.role)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${u.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                      {u.active ? "ACTIVE" : "DISABLED"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{fmt(u.lastLoginAt)}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => edit(u)} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Edit</button>
                    {!self && <button onClick={() => remove(u)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
