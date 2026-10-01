import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { inr } from "../../roles";

const TYPES = ["STANDARD", "SINGLE", "DOUBLE", "DELUXE", "SUITE", "FAMILY"];
const blank = {
  roomNumber: "", name: "", type: "STANDARD", pricePerNight: "", capacity: "2",
  size: "", amenities: "", imageUrl: "", description: "", available: true,
};
const inputCls = "mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8893C]";

export default function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/api/rooms").then((d) => setRooms(d || [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const flash = (t) => { setOk(t); setTimeout(() => setOk(""), 3000); };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch(editingId ? `/api/rooms/${editingId}` : "/api/rooms", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          roomNumber: form.roomNumber.trim(),
          name: form.name.trim(),
          type: form.type,
          pricePerNight: Number(form.pricePerNight),
          capacity: form.capacity === "" ? null : Number(form.capacity),
          size: form.size.trim() || null,
          amenities: form.amenities.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          description: form.description.trim() || null,
          available: form.available,
        }),
      });
      flash(editingId ? "✅ Room updated" : "✅ Room added");
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({
      roomNumber: r.roomNumber || "", name: r.name || "", type: r.type || "STANDARD",
      pricePerNight: String(r.pricePerNight ?? ""), capacity: r.capacity == null ? "" : String(r.capacity),
      size: r.size || "", amenities: r.amenities || "", imageUrl: r.imageUrl || "",
      description: r.description || "", available: !!r.available,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete room ${r.roomNumber}?`)) return;
    try {
      await apiFetch(`/api/rooms/${r.id}`, { method: "DELETE" });
      flash("Room deleted");
      if (editingId === r.id) { setEditingId(null); setForm(blank); }
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <form onSubmit={save} className="bg-white border rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-[#1F3B2D]">{editingId ? "Edit room" : "Add a new room"}</h3>
        {error && <p role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</p>}
        {ok && <p className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">{ok}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
          <div>
            <label className="text-xs font-semibold">Room number</label>
            <input required value={form.roomNumber} onChange={set("roomNumber")} placeholder="e.g. 107" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold">Room name (shown on website)</label>
            <input required value={form.name} onChange={set("name")} placeholder="e.g. Deluxe Room" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Type</label>
            <select value={form.type} onChange={set("type")} className={inputCls + " bg-white"}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Price per night (₹)</label>
            <input required type="number" min="1" step="0.01" value={form.pricePerNight} onChange={set("pricePerNight")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Guests (capacity)</label>
            <input type="number" min="1" value={form.capacity} onChange={set("capacity")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Size</label>
            <input value={form.size} onChange={set("size")} placeholder="e.g. 280 sq ft" className={inputCls} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.available} onChange={set("available")} />
              Available for booking
            </label>
          </div>
          <div className="md:col-span-4">
            <label className="text-xs font-semibold">Amenities (separate with commas)</label>
            <input value={form.amenities} onChange={set("amenities")} placeholder="King bed, Free Wi-Fi, Air conditioning" className={inputCls} />
          </div>
          <div className="md:col-span-4">
            <label className="text-xs font-semibold">Image link</label>
            <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..." className={inputCls} />
          </div>
          <div className="md:col-span-4">
            <label className="text-xs font-semibold">Description</label>
            <input value={form.description} onChange={set("description")} className={inputCls} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={saving} className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save changes" : "Add room"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(blank); setError(""); }} className="px-5 py-2 rounded-full bg-gray-100 text-sm font-bold">Cancel edit</button>
          )}
        </div>
      </form>

      <h3 className="mt-6 font-bold text-[#1F3B2D]">All rooms ({rooms.length})</h3>
      <div className="mt-3 bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">No.</th><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Price / night</th><th className="p-3">Guests</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {rooms.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-gray-400">No rooms yet</td></tr>}
            {rooms.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{r.roomNumber}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3">{inr(r.pricePerNight)}</td>
                <td className="p-3">{r.capacity}</td>
                <td className="p-3">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${r.available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {r.available ? "AVAILABLE" : "HIDDEN"}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button onClick={() => edit(r)} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={() => remove(r)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">A room that already has bookings cannot be deleted - untick "Available for booking" instead.</p>
    </div>
  );
}
