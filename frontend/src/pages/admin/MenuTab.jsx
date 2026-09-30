import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch, apiUpload, imgUrl } from "../../api";
import { inr } from "../../roles";

const blank = { name: "", category: "", type: "veg", price: "", description: "", imageUrl: "", available: true };
const inputCls = "mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8893C]";

export default function MenuTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // upload / change the item's photo from this device; the new address goes into the form, saved with "Save"
  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (JPG, PNG, WEBP or GIF)."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("The image is too large. Please choose an image smaller than 5 MB."); return; }
    setError("");
    setUploading(true);
    try {
      const { url } = await apiUpload("/api/admin/uploads", file);
      setForm((f) => ({ ...f, imageUrl: url }));
      flash(editingId ? "✅ New image uploaded - press “Save changes” to keep it" : "✅ Image uploaded");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    apiFetch("/api/admin/menu").then((d) => setItems(d || [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const flash = (t) => { setOk(t); setTimeout(() => setOk(""), 3000); };

  const bodyOf = (f) => ({
    name: f.name.trim(),
    category: f.category.trim(),
    type: f.type,
    price: Number(f.price),
    description: f.description,
    imageUrl: f.imageUrl.trim() || null,
    available: f.available,
  });

  const sameName = (a, b) => a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const dup = items.find((i) => i.id !== editingId && sameName(i.name, form.name));
    if (dup) {
      setError(`"${dup.name}" already exists in the menu. Please use a different name.`);
      return;
    }
    setSaving(true);
    try {
      await apiFetch(editingId ? `/api/menu/${editingId}` : "/api/menu", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(bodyOf(form)),
      });
      flash(editingId ? "✅ Item updated" : "✅ Item added");
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (it) => {
    setEditingId(it.id);
    setForm({
      name: it.name, category: it.category, type: it.type, price: String(it.price),
      description: it.description || "", imageUrl: it.imageUrl || "", available: !!it.available,
    });
    setError("");
    // the panel scrolls its own content area, so bring the form itself into view
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggle = async (it) => {
    try {
      await apiFetch(`/api/menu/${it.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...bodyOf({ ...it, price: String(it.price), imageUrl: it.imageUrl || "", description: it.description || "" }), available: !it.available }),
      });
      load();
    } catch (err) { setError(err.message); }
  };

  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.name}"? (Old sales reports keep it.)`)) return;
    try {
      await apiFetch(`/api/menu/${it.id}`, { method: "DELETE" });
      flash("Item deleted");
      if (editingId === it.id) { setEditingId(null); setForm(blank); }
      load();
    } catch (err) { setError(err.message); }
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const shown = items.filter((i) => (i.name + " " + i.category).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <form ref={formRef} onSubmit={save} className="bg-white border rounded-2xl p-5 shadow-sm scroll-mt-4">
        <h3 className="font-bold text-[#1F3B2D]">{editingId ? "Edit item" : "Add a new menu item"}</h3>
        {error && <p role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</p>}
        {ok && <p className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">{ok}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold">Item name</label>
            <input required value={form.name} onChange={set("name")} className={inputCls} />
            {form.name.trim() && items.some((i) => i.id !== editingId && sameName(i.name, form.name)) && (
              <p className="text-xs text-red-600 mt-1">This item already exists in the menu.</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold">Category</label>
            <input required list="menu-cats" value={form.category} onChange={set("category")} placeholder="e.g. Starter" className={inputCls} />
            <datalist id="menu-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="text-xs font-semibold">Price (₹)</label>
            <input required type="number" min="1" step="0.01" value={form.price} onChange={set("price")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Type</label>
            <select value={form.type} onChange={set("type")} className={inputCls + " bg-white"}>
              <option value="veg">Veg</option>
              <option value="nonveg">Non-veg</option>
              <option value="common">Common (water, etc.)</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="text-xs font-semibold">Item image (optional)</label>
            <div className="mt-1 flex flex-col md:flex-row md:items-start gap-3">
              <div className="w-32 h-24 shrink-0 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
                {form.imageUrl ? (
                  <img src={imgUrl(form.imageUrl)} alt="Item preview" className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} onLoad={(e) => { e.currentTarget.style.display = ""; }} />
                ) : (
                  <span className="text-2xl" aria-hidden="true">🍽️</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`inline-flex items-center px-4 py-2 rounded-lg border-2 border-dashed text-sm font-semibold cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : "hover:bg-gray-50"}`}>
                    {uploading ? "Uploading..." : form.imageUrl ? "📁 Change image" : "📁 Upload from device"}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadImage} className="hidden" />
                  </label>
                  {form.imageUrl && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))} className="text-xs font-bold text-red-600">Remove image</button>
                  )}
                </div>
                <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="or paste a link: https://... or /images/name.jpg" className={inputCls + " !mt-0"} />
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.available} onChange={set("available")} />
              Show to customers
            </label>
          </div>
          <div className="md:col-span-4">
            <label className="text-xs font-semibold">Description (max 500 characters)</label>
            <input maxLength={500} value={form.description} onChange={set("description")} className={inputCls} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={saving || uploading} className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save changes" : "Add item"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(blank); setError(""); }} className="px-5 py-2 rounded-full bg-gray-100 text-sm font-bold">Cancel edit</button>
          )}
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h3 className="font-bold text-[#1F3B2D]">All items ({items.length})</h3>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search..." className="border rounded-lg px-3 py-1.5 text-sm" />
      </div>
      <div className="mt-3 bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Image</th><th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">Type</th><th className="p-3">Price</th><th className="p-3">Visible</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-gray-400">No items</td></tr>}
            {shown.map((it) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="p-3">
                  {it.imageUrl ? <img src={imgUrl(it.imageUrl)} alt="" loading="lazy" className="h-10 w-14 object-cover rounded" /> : <span className="text-xs text-gray-400">-</span>}
                </td>
                <td className="p-3 font-semibold">{it.name}</td>
                <td className="p-3">{it.category}</td>
                <td className="p-3">{it.type}</td>
                <td className="p-3">{inr(it.price)}</td>
                <td className="p-3">
                  <button onClick={() => toggle(it)} className={`text-[10px] px-2 py-1 rounded-full font-bold ${it.available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {it.available ? "SHOWN" : "HIDDEN"}
                  </button>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button onClick={() => edit(it)} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={() => remove(it)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
