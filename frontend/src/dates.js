export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };

export const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export const minutesSince = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? 0 : Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
};
