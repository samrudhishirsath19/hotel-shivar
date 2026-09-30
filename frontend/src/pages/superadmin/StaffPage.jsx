import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { PageTitle, Notice, Badge, inputCls } from "./ui";

const blank = { name: "", jobTitle: "", phone: "", joinedOn: "", active: true };
const TITLES = ["Cook", "Waiter", "Captain", "Cleaner", "Receptionist", "Security", "Cashier", "Manager"];

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/api/admin/staff").then((d) => setStaff(d || [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const flash = (t) => { setOk(t); setTimeout(() => setOk(""), 3000); };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch(editingId ? `/api/admin/staff/${editingId}` : "/api/admin/staff", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          jobTitle: form.jobTitle.trim(),
          phone: form.phone.trim() || null,
          joinedOn: form.joinedOn || null,
          active: form.active,
        }),
      });
      flash(editingId ? "✅ Staff member updated" : "✅ Staff member added");
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (s) => {
    setEditingId(s.id);
    setForm({ name: s.name, jobTitle: s.jobTitle, phone: s.phone || "", joinedOn: s.joinedOn || "", active: !!s.active });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.name} from the staff list?`)) return;
    try {
      await apiFetch(`/api/admin/staff/${s.id}`, { method: "DELETE" });
      flash("Staff member removed");
      if (editingId === s.id) { setEditingId(null); setForm(blank); }
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <PageTitle title="Staff" sub="Hotel employees. To give someone a login, use the Users page." />

      <form onSubmit={save} className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900">{editingId ? "Edit staff member" : "Add a staff member"}</h3>
        <Notice error={error} ok={ok} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
          <div>
            <label className="text-xs font-semibold">Name</label>
            <input required value={form.name} onChange={set("name")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Job title</label>
            <input required list="staff-titles" value={form.jobTitle} onChange={set("jobTitle")} className={inputCls} />
            <datalist id="staff-titles">{TITLES.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          <div>
            <label className="text-xs font-semibold">Phone</label>
            <input value={form.phone} onChange={set("phone")} inputMode="tel" maxLength={20} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Joined on</label>
            <input type="date" value={form.joinedOn} onChange={set("joinedOn")} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-4">
            <input type="checkbox" checked={form.active} onChange={set("active")} />
            Currently working
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={saving} className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save changes" : "Add staff member"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(blank); setError(""); }} className="px-5 py-2 rounded-full bg-gray-100 text-sm font-bold">Cancel edit</button>
          )}
        </div>
      </form>

      <h3 className="mt-6 font-bold text-gray-900">All staff ({staff.length})</h3>
      <div className="mt-3 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Name</th><th className="p-3">Job title</th><th className="p-3">Phone</th><th className="p-3">Joined</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {staff.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-400">No staff added yet</td></tr>}
            {staff.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{s.name}</td>
                <td className="p-3">{s.jobTitle}</td>
                <td className="p-3">{s.phone || "-"}</td>
                <td className="p-3">{s.joinedOn || "-"}</td>
                <td className="p-3"><Badge on={s.active} yes="WORKING" no="LEFT" /></td>
                <td className="p-3 whitespace-nowrap">
                  <button onClick={() => edit(s)} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={() => remove(s)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
