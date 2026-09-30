import { Fragment, useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { deptName } from "../../roles";
import { PageTitle, Switch } from "./ui";
import { Toast } from "./Ticket";

// Super admin: switch each permission (sub-module / action) on or off for each department.
// Every switch is saved at once; the backend enforces it on every API call.
export default function ModuleAccessPage() {
  const { reloadModules } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(""); // "ROLE:PERMISSION" being saved
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => {
    apiFetch("/api/admin/module-access").then(setData).catch((e) => setError(e.message));
  }, []);

  const has = (role, perm) => (data?.grants?.[role] || []).includes(perm);

  const toggle = async (role, p, on) => {
    setBusy(`${role}:${p.permission}`);
    setError("");
    const before = data;
    // show the change straight away, put it back if saving fails
    setData((d) => ({
      ...d,
      grants: { ...d.grants, [role]: on ? [...(d.grants[role] || []), p.permission] : (d.grants[role] || []).filter((x) => x !== p.permission) },
    }));
    try {
      const saved = await apiFetch(`/api/admin/module-access/${role}/${p.permission}`, { method: "PUT", body: JSON.stringify({ enabled: on }) });
      setData(saved);
      reloadModules();
      flash(`${on ? "✅ Allowed" : "Blocked"}: ${p.label} - ${deptName(role)}`);
    } catch (e) {
      setData(before);
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  if (!data) {
    return (
      <>
        <PageTitle title="Module Access" />
        {error ? <p className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p> : <p className="text-sm text-gray-500">Loading...</p>}
      </>
    );
  }

  const onIn = (role, mod) => mod.permissions.filter((p) => has(role, p.permission)).length;

  return (
    <div>
      <Toast msg={msg} />
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-1 text-2xl">🔐</span>
        <PageTitle title="Module Access" sub="Switch each feature on or off for each department. Changes are saved at once and apply on the next click - also for direct links." />
      </div>
      {error && <p role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      {/* desktop / tablet: permissions x departments, grouped by module */}
      <div className="hidden md:block bg-white rounded-2xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th scope="col" className="p-4 font-semibold text-gray-700">Module / permission</th>
              {data.roles.map((r) => (
                <th key={r} scope="col" className="p-4 text-center font-semibold text-gray-700 whitespace-nowrap">{deptName(r)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.modules.map((m) => (
              <Fragment key={m.module}>
                <tr className="bg-[#F3F5F1] border-b">
                  <th scope="rowgroup" className="px-4 py-2.5 text-left">
                    <span className="font-bold text-[#1F3B2D]">{m.label}</span>
                    <span className="ml-2 text-xs font-normal text-gray-500">{m.description}</span>
                  </th>
                  {data.roles.map((r) => (
                    <td key={r} className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                      {onIn(r, m)} / {m.permissions.length} on
                    </td>
                  ))}
                </tr>
                {m.permissions.map((p) => (
                  <tr key={p.permission} className="border-b last:border-0 hover:bg-gray-50/60">
                    <th scope="row" className="pl-8 pr-4 py-3 text-left font-normal align-top">
                      <div className="font-semibold text-gray-900">{p.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5 max-w-sm">{p.description}</div>
                    </th>
                    {data.roles.map((r) => (
                      <td key={r} className="px-4 py-3 text-center align-middle">
                        <div className="inline-flex">
                          <Switch on={has(r, p.permission)} disabled={busy === `${r}:${p.permission}`}
                            label={`${p.label} for ${deptName(r)}`} onChange={(v) => toggle(r, p, v)} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* phone: one card per module, a row per permission */}
      <div className="md:hidden space-y-4">
        {data.modules.map((m) => (
          <article key={m.module} className="bg-white rounded-2xl border shadow-sm p-4">
            <h3 className="font-bold text-[#1F3B2D]">{m.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
            {m.permissions.map((p) => (
              <div key={p.permission} className="mt-4 border-t pt-3">
                <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                <p className="text-xs text-gray-500">{p.description}</p>
                <ul className="mt-2 space-y-2">
                  {data.roles.map((r) => (
                    <li key={r} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700">{deptName(r)}</span>
                      <Switch on={has(r, p.permission)} disabled={busy === `${r}:${p.permission}`}
                        label={`${p.label} for ${deptName(r)}`} onChange={(v) => toggle(r, p, v)} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </article>
        ))}
      </div>

      <div className="mt-6 text-xs text-gray-500 space-y-1 border-t pt-4 max-w-4xl">
        {data.updatedAt && <p>Last changed {new Date(data.updatedAt).toLocaleString("en-IN")}{data.updatedBy ? ` by ${data.updatedBy}` : ""}.</p>}
        <p>Each switch is checked by the server on every request, so a blocked feature cannot be opened through a direct link or API either. A department's sidebar and buttons update within a minute or on its next page load.</p>
        <p>The Super Admin always has every feature. Users and Module Access stay with the Super Admin only.</p>
      </div>
    </div>
  );
}
