// Departments = login roles. Must match the backend (Roles.java / AccessPolicy.java).
export const DEPARTMENTS = [
  { value: "SUPER_ADMIN", label: "Super Admin", help: "Everything: menu, rooms, users, sales dashboard, orders, bookings" },
  { value: "MANAGER", label: "Manager", help: "Orders, tables, online orders, room bookings, enquiries" },
  { value: "RECEPTION", label: "Reception (Front desk)", help: "Room bookings only" },
  { value: "RESTAURANT", label: "Restaurant (Captain)", help: "Table, room-service and online orders" },
  { value: "KITCHEN", label: "Kitchen", help: "View running orders only" },
];

export const roleLabel = (role) => DEPARTMENTS.find((d) => d.value === role)?.label || role;

export const isSuper = (role) => role === "SUPER_ADMIN";
export const canSeeOrders = (role) => ["SUPER_ADMIN", "MANAGER", "RESTAURANT", "KITCHEN"].includes(role);
export const canEditOrders = (role) => ["SUPER_ADMIN", "MANAGER", "RESTAURANT"].includes(role);
export const canSeeBookings = (role) => ["SUPER_ADMIN", "MANAGER", "RECEPTION"].includes(role);

// Where each person lands after login
export const homeFor = (role) => (role === "SUPER_ADMIN" ? "/super-admin" : "/manager");

// Can this role open this page? (used to decide if we can return them to the page they asked for)
export const canOpen = (role, path) =>
  path.startsWith("/admin") || path.startsWith("/super-admin") ? role === "SUPER_ADMIN" : true;

export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
