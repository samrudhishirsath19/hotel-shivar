// Departments = login roles. Must match the backend (Roles.java / AccessPolicy.java).
export const DEPARTMENTS = [
  { value: "SUPER_ADMIN", label: "Super Admin", help: "Everything: menu, rooms, users, sales dashboard, orders, bookings" },
  { value: "MANAGER", label: "Manager", help: "Orders (same KOT as the captain), tables, online orders, room bookings, inventory / purchase / stock details" },
  { value: "RECEPTION", label: "Reception (Front desk)", help: "Room bookings only" },
  { value: "RESTAURANT", label: "Restaurant (Captain)", help: "Take orders, send them to the kitchen, send served orders to Billing" },
  { value: "KITCHEN", label: "Kitchen", help: "New orders (KOT) - mark them ready" },
  { value: "BILLING", label: "Billing", help: "Billing only: take payment for orders sent to Billing, print bills, see paid bills" },
];

export const roleLabel = (role) => DEPARTMENTS.find((d) => d.value === role)?.label || role;
// short department names (table headers, switches)
export const deptName = (role) =>
  ({ MANAGER: "Manager", RECEPTION: "Reception", RESTAURANT: "Captain", KITCHEN: "Kitchen", BILLING: "Billing", SUPER_ADMIN: "Super Admin" }[role] || roleLabel(role));

export const isSuper = (role) => role === "SUPER_ADMIN";

// ---------------------------------------------------------------------------
// Module Access: the super admin switches each permission (sub-module / action) on or off per department
// (saved in the database, enforced by the backend - AccessPolicy.java). AuthContext loads the logged-in
// department's permissions into this store; pages use can() to show only what the user may do.
// ---------------------------------------------------------------------------
let myPerms = new Set();
export const setMyPerms = (list) => { myPerms = new Set(list || []); };
export const can = (role, perm) => role === "SUPER_ADMIN" || myPerms.has(perm);

// Dashboard panel: every department gets the same green-sidebar panel, with only the pages it may open.
//   perm  - the permission that opens the page (the super admin has all)
//   roles - fixed list instead of a permission (pages that are not part of Module Access)
const ALL_ROLES = DEPARTMENTS.map((d) => d.value);
export const SECTIONS = [
  { id: "dashboard", label: "Dashboard", roles: ALL_ROLES },
  { id: "kot", label: "KOT",  perm: "KOT_VIEW" },
  { id: "online", label: "Online Orders", perm: "ONLINE_VIEW" },
  { id: "menu", label: "Menu", perm: "ORDER_TAKING" },
  { id: "tables", label: "Tables", perm: "TABLE_VIEW" },
  { id: "reservation", label: "Reservation", perm: "BOOKING_VIEW" },
  { id: "rooms", label: "Rooms", perm: "ROOMS_SETUP" },
  { id: "billing", label: "Billing", perm: "BILLING_VIEW" },
  { id: "inventory", label: "Inventory", perm: "INVENTORY_VIEW" },
  { id: "purchase", label: "Purchase", perm: "PURCHASE_VIEW" },
  { id: "staff", label: "Staff", perm: "STAFF_VIEW" },
  { id: "sales", label: "Reports", perm: "SALES_REPORT" },
  { id: "gst", label: "GST Settings", perm: "GST_SETTINGS" },
  { id: "module-access", label: "Module Access", roles: ["SUPER_ADMIN"] },
  { id: "users", label: "Users", roles: ["SUPER_ADMIN"] },
];
export const canSee = (role, id) => {
  const s = SECTIONS.find((x) => x.id === id);
  if (!s || !role) return false;
  if (s.roles) return s.roles.includes(role);
  return can(role, s.perm);
};

// Super admin keeps /super-admin; every other department uses /panel
export const panelBase = (role) => (role === "SUPER_ADMIN" ? "/super-admin" : "/panel");
export const panelName = (role) =>
  ({ SUPER_ADMIN: "Super Admin", MANAGER: "Manager", RECEPTION: "Reception", RESTAURANT: "Restaurant", KITCHEN: "Kitchen", BILLING: "Billing" }[role] || "Staff") + " Panel";

// Where each person lands after login
export const homeFor = (role) => panelBase(role);

// Can this role open this page? (used to decide if we can return them to the page they asked for)
export const canOpen = (role, path) => {
  if (path.startsWith("/admin") || path.startsWith("/super-admin")) return role === "SUPER_ADMIN";
  if (path.startsWith("/panel")) return role !== "SUPER_ADMIN";
  return true;
};

export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// Phone numbers: exactly 10 digits. digits10 keeps only digits (max 10) while typing.
export const digits10 = (v) => String(v || "").replace(/\D/g, "").slice(0, 10);
export const isPhone10 = (v) => /^\d{10}$/.test(String(v || ""));
export const PHONE_ERROR = "Phone number must be exactly 10 digits.";
