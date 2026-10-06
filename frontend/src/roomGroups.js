// Groups rooms into categories (by the name shown on the website, e.g. "Deluxe Room").
// Each room number is listed once, and rooms that are booked for the chosen dates are left out of `free`.
const keyOf = (r) => (r.name || `Room ${r.roomNumber}`).trim().replace(/\s+/g, " ").toLowerCase();
const byNumber = (a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true });

export function groupRooms(rooms, occupiedIds = []) {
  const occupied = new Set((occupiedIds || []).map(Number));
  const groups = new Map();
  for (const r of rooms || []) {
    const k = keyOf(r);
    if (!groups.has(k)) groups.set(k, { key: k, name: (r.name || `Room ${r.roomNumber}`).trim(), rooms: [], seen: new Set() });
    const g = groups.get(k);
    const num = String(r.roomNumber).trim();
    if (g.seen.has(num)) continue; // same room number twice -> show once
    g.seen.add(num);
    g.rooms.push(r);
  }
  return [...groups.values()].map((g) => {
    const all = g.rooms.slice().sort(byNumber);
    const free = all.filter((r) => !occupied.has(Number(r.id)));
    const prices = all.map((r) => Number(r.pricePerNight)).filter((p) => p > 0);
    return {
      key: g.key,
      name: g.name,
      all,
      free,
      fullyBooked: free.length === 0,
      minPrice: prices.length ? Math.min(...prices) : 0,
      sample: free[0] || all[0],
    };
  });
}
