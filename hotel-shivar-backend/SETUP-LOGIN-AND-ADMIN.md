# Hotel Shivar - logins, departments, super admin dashboard

## First login
On the first start the backend creates one Super Admin (only if that email does not exist yet):

- email:    admin@hotelshivar.com
- password: Admin@12345

Change it before going live: edit `app.admin.*` in `src/main/resources/hotelshivar-app.properties`
(or set ADMIN_EMAIL / ADMIN_PASSWORD environment variables). Also set a private JWT_SECRET (32+ characters).
If the admin already exists in the database, changing the file does not change the password -
log in and edit the user in Super Admin > Users.

## Departments (each login has one)
| Department   | Can do |
|--------------|--------|
| SUPER_ADMIN  | Everything: menu items, rooms, users, sales dashboard, orders, bookings |
| MANAGER      | Orders (tables, room service, online), bookings, contact + banquet enquiries |
| RECEPTION    | Room bookings |
| RESTAURANT   | Table, room-service and online orders |
| KITCHEN      | View running orders only |

Super admin creates the other logins in the frontend: /super-admin > Users.
Any URL not listed in `security/AccessPolicy.java` is Super Admin only, so a forgotten endpoint is locked, not open.

## Pages (frontend)
- /login    - all staff log in here (email + password). Wrong details stay on this page.
- /super-admin - Super Admin only. Green sidebar: Dashboard (overview cards + sales charts), KOT, Menu, Tables,
  Reservation (bookings + rooms), Billing, Inventory, Purchase, Staff, Users. (/admin redirects here.)
- /manager  - every staff department; shows what that department may use (occupied tables, orders, bookings).

## Sales rules (what the charts count)
- Food: an order counts on the day the manager presses "Bill Paid".
- Rooms: a booking counts when it is CONFIRMED or COMPLETED, on the day it was booked (nights x price per night).

## MySQL: "add room does not save" fix
Your config is not touched (application.properties / application-mysql.properties are NOT in this zip).
On start, `config/SchemaFixer.java` repairs an existing MySQL `rooms` table:
- `type` column: Hibernate created it as a MySQL ENUM that rejects newer room types -> changed to VARCHAR(30)
- `image_url` column: was VARCHAR(255) and rejected long image links -> now VARCHAR(1000)
Errors while saving a room are now shown in plain words in the admin screen.
If a room still does not save, send the red error text shown above the form (or the red error in the IntelliJ console).

## Notes
- If IntelliJ says "ConflictingBeanDefinitionException ... CorsConfig", you have two CorsConfig classes
  (config.CorsConfig and common.config.CorsConfig). Delete one of them.
- Default menu (16 items) and rooms (101-106) are added once, only when those tables are empty.
- Offers / gallery changes (POST/PUT/DELETE) are Super Admin only on the backend; there is no admin screen for them yet.

## Super admin pages and what they use
| Page        | What it shows | Backend |
|-------------|---------------|---------|
| Dashboard   | Occupied Tables, Online Orders, Today's Revenue, Pending KOT + a 7-day sales graph (one screen, no scrolling). "Full sales report" opens /super-admin/sales with all charts | /api/admin/orders/board, /api/admin/reports/sales |
| KOT         | Tickets split into "Being prepared" and "Ready". Mark Ready / Back to Preparing, Cancel. "+ New order" takes Table / Room / Online (phone) orders. No payment here | /api/admin/orders/**, /api/orders/** |
| Menu        | Add / edit / hide / delete menu items | /api/menu, /api/admin/menu |
| Tables      | Which tables are occupied, with their items and kitchen status | /api/admin/orders/board |
| Reservation | Room bookings (confirm / complete / cancel) and Rooms (add / edit / delete) | /api/bookings, /api/rooms |
| Billing     | "Unpaid bills" (running orders) with the Bill Paid button; a paid order moves into "Paid bills" (by date, with items) | /api/admin/orders/{id}/paid, /api/admin/billing |
| Inventory   | Stock in hand, LOW warning when stock reaches the low-stock level | /api/admin/inventory |
| Purchase    | Record purchases; stock goes up automatically; deleting a purchase takes it back out | /api/admin/purchases |
| Staff       | Employee list (name, job title, phone, joined date) - not logins | /api/admin/staff |
| Users       | Logins per department | /api/admin/users |

"Pending KOT" = running kitchen tickets that are not Ready yet (occupied tables + room service + accepted online orders).
Adding an item to a Ready order puts it back to Preparing.
New tables (admin_users, food_orders, menu_items, inventory_items, purchases, staff_members) are created automatically.

## Website vs dashboard
- The public Restaurant page only lists the menu; customers order through the cart (Online). The Table / Room / Online switcher is gone from it.
- Table and room orders are taken in the dashboard (KOT > "+ New order"). /api/orders/adjust, /current and /config now need a login
  (Super Admin, Manager or Restaurant). Only POST /api/orders/online (customer cart) is still public.
- Kitchen department: can mark orders Ready / Preparing on the /manager page.
- New column food_orders.kitchen_status is added automatically; old orders without a value show as Preparing.
