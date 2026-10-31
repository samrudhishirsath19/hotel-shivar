// Departments = login roles. Must match the backend (Roles.java / AccessPolicy.java).
export const DEPARTMENTS = [
  { value: "SUPER_ADMIN", label: "Super Admin", help: "Everything: menu, rooms, users, sales dashboard, orders, bookings" },
  { value: "MANAGER", label: "Manager", help: "Orders (same KOT as the captain), tables, online orders, room bookings, inventory / purchase / stock details" },
  { value: "RECEPTION", label: "Reception (Front desk)", help: "Room bookings only" },
  { value: "RESTAURANT", label: "Restaurant (Captain)", help: "Take orders, send them to the kitchen, send served orders to Billing" },
  { value: "KITCHEN", label: "Kitchen", help: "KOT: the only department that confirms online orders and marks food Ready" },
  { value: "BILLING", label: "Billing", help: "Billing only: take payment for orders sent to Billing, print bills, see paid bills" },
  { value: "ORDER_USER", label: "Order User", help: "Online orders: Delivery Dispatch (send Ready orders out with a delivery boy), track delivery, manage delivery boy logins" },
  { value: "DELIVERY_BOY", label: "Delivery Boy", help: "Only the orders assigned to him: accept, pick up and deliver them" },
];

export const roleLabel = (role) => DEPARTMENTS.find((d) => d.value === role)?.label || role;
// short department names (table headers, switches)
export const deptName = (role) =>
  ({ MANAGER: "Manager", RECEPTION: "Reception", RESTAURANT: "Captain", KITCHEN: "Kitchen", BILLING: "Billing", ORDER_USER: "Order User",
    DELIVERY_BOY: "Delivery", SUPER_ADMIN: "Super Admin" }[role] || roleLabel(role));

export const isSuper = (role) => role === "SUPER_ADMIN";

// Fixed kitchen duties (not on Module Access, not even the super admin): confirm online orders on the KOT
// and mark food Ready. The backend allows only the KITCHEN login for these (AccessPolicy KITCHEN_ONLY).
export const isKitchen = (role) => role === "KITCHEN";

// ---------------------------------------------------------------------------
// Module Access: the super admin switches each permission (sub-module / action) on or off per department
// (saved in the database, enforced by the backend - AccessPolicy.java). AuthContext loads the logged-in
// department's permissions into this store; pages use can() to show only what the user may do.
// ---------------------------------------------------------------------------
let myPerms = new Set();
export const setMyPerms = (list) => { myPerms = new Set(list || []); };
export const can = (role, perm) => role === "SUPER_ADMIN" || myPerms.has(perm);

// Dashboard panel: every department gets the same green-sidebar panel, with only the pages it may open.
//   perm  - the permission that opens the page (or a list: any one of them; the super admin has all)
//   roles - fixed list instead of a permission (pages that are not part of Module Access)
const ALL_ROLES = DEPARTMENTS.map((d) => d.value);
export const SECTIONS = [
  { id: "dashboard", label: "Dashboard", roles: ALL_ROLES.filter((r) => r !== "DELIVERY_BOY") },
  { id: "deliveries", label: "My Deliveries", roles: ["DELIVERY_BOY"] },
  { id: "kot", label: "KOT",  perm: "KOT_VIEW" },
  { id: "online", label: "Online Orders", perm: "ONLINE_VIEW" },
  { id: "dispatch", label: "Delivery Dispatch", perm: "DELIVERY_DISPATCH" },
  { id: "delivery-boys", label: "Delivery Boys", perm: ["DELIVERY_STAFF", "DELIVERY_ASSIGN"] },
  { id: "menu", label: "Menu", perm: "ORDER_TAKING" },
  { id: "tables", label: "Tables", perm: "TABLE_VIEW" },
  { id: "reservation", label: "Reservation", perm: "BOOKING_VIEW" },
  { id: "rooms", label: "Rooms", perm: "ROOMS_SETUP" },
  { id: "billing", label: "Billing", perm: "BILLING_VIEW" },
  { id: "inventory", label: "Inventory", perm: ["INVENTORY_VIEW", "INVENTORY_OUT"] },
  { id: "purchase", label: "Purchase", perm: "PURCHASE_VIEW" },
  { id: "staff", label: "Staff", perm: "STAFF_VIEW" },
  { id: "enquiries", label: "Enquiries", perm: "ENQUIRIES" },
  { id: "offers", label: "Offers", perm: "OFFERS_MANAGE" },
  { id: "sales", label: "Reports", perm: "SALES_REPORT" },
  { id: "gst", label: "GST Settings", perm: "GST_SETTINGS" },
  { id: "module-access", label: "Module Access", roles: ["SUPER_ADMIN"] },
  { id: "users", label: "Users", roles: ["SUPER_ADMIN"] },
];
export const canSee = (role, id) => {
  const s = SECTIONS.find((x) => x.id === id);
  if (!s || !role) return false;
  if (s.roles) return s.roles.includes(role);
  return [].concat(s.perm).some((p) => can(role, p));
};

// Super admin keeps /super-admin; every other department uses /panel
export const panelBase = (role) => (role === "SUPER_ADMIN" ? "/super-admin" : "/panel");
export const panelName = (role) =>
  ({ SUPER_ADMIN: "Super Admin", MANAGER: "Manager", RECEPTION: "Reception", RESTAURANT: "Restaurant", KITCHEN: "Kitchen", BILLING: "Billing",
    ORDER_USER: "Order User", DELIVERY_BOY: "Delivery" }[role] || "Staff") + " Panel";

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

// Full names: letters in any script, spaces between words, and . ' - (e.g. "Ravi Kumar Sharma", "D'Souza").
// Same rule as the server (Names.java). cleanName removes extra spaces before sending.
export const NAME_MAX = 100;
export const cleanName = (v) => String(v || "").trim().replace(/\s+/g, " ");
export const isFullName = (v) => /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,99}$/u.test(cleanName(v));
export const NAME_ERROR = "Enter a valid full name (letters and spaces only).";
