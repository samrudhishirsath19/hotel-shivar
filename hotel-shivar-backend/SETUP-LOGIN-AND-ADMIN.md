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
<<<<<<< Updated upstream
=======

## Order flow (super admin)
1. Table / room orders are taken inside the dashboard: KOT > "New order" (Table, Room or phone/online). The public website only shows the menu and the customer cart for online orders.
2. KOT shows tickets only: "Being prepared" and "Ready" (Mark ready / Back to preparing / Cancel). No payment here.
3. Billing > "Unpaid bills": press Bill Paid. The order moves to "Paid bills" and is counted in Today's Revenue.
4. The Tables page still has "Bill Paid - Free Table" for convenience.

## MySQL error "Public Key Retrieval is not allowed"
`config/MysqlLocalUrlFixer.java` (registered in `META-INF/spring.factories`) adds `allowPublicKeyRetrieval=true`
to your `spring.datasource.url` at startup when it is a MySQL URL on localhost / 127.0.0.1. Your properties file is not changed.
If your MySQL is on another computer, add `?allowPublicKeyRetrieval=true` (or use SSL) in the URL yourself.

## Billing department + one dashboard for every department
Every login now gets the SAME green-sidebar panel as the super admin, with only the pages of its own department.
The super admin keeps `/super-admin`; every other department uses `/panel` (the old `/manager` address redirects there).
After login each person is sent to their own panel automatically.

| Department  | Sidebar pages                                              | Dashboard cards / poll |
|-------------|------------------------------------------------------------|------------------------|
| Super Admin | Dashboard, KOT, Menu, Tables, Reservation, Billing, Inventory, Purchase, Staff, Users | Occupied tables, online orders, today's revenue, pending KOT + sales poll (7 days) |
| Manager     | Dashboard, KOT, Tables, Reservation, Billing, Inventory (view only) | Tables, online orders, today's collection, pending KOT + live-orders poll |
| Restaurant  | Dashboard, KOT (take orders, send to billing), Tables      | Tables, online orders, ready to serve, pending KOT + live-orders poll |
| Kitchen     | Dashboard, KOT (mark ready)                                | Pending KOT, ready, tables, online orders + live-orders poll |
| Reception   | Dashboard, Reservation (bookings)                          | Pending / confirmed / check-ins today / total bookings + bookings-by-status poll |
| Billing     | Dashboard, Billing (take payment, print bill, paid bills)  | Unpaid bills, unpaid amount, today's bills, today's collection + collection poll |

Ready-made Billing login (created on first start, see `hotelshivar-app.properties`):
- email `billing@hotelshivar.com`, password `Billing@12345` (change it, or set BILLING_EMAIL / BILLING_PASSWORD; leave the email empty to skip)
- more Billing users: Super Admin > Users > Department "Billing"

The backend enforces the same rules (`security/AccessPolicy.java`): the Billing department can only see the order board,
take payment (`/paid`) and read paid bills; it cannot cancel orders, change the menu or open any other page.
>>>>>>> Stashed changes
