# Manager login - backend

New endpoints
- POST /api/auth/login   (public)  body: {"email","password"} -> token, or 401 "Invalid email or password"
- GET  /api/auth/me      (needs token)
- GET  /api/admin/dashboard/summary (needs token) - everything under /api/admin/** needs a token

First super admin (created automatically on first start, see application.properties):
- email:    admin@hotelshivar.com
- password: Admin@12345
Change both before going live (edit app.admin.* or set ADMIN_EMAIL / ADMIN_PASSWORD env vars).
Also set a private JWT_SECRET (32+ characters) in production.

The password is stored only as a BCrypt hash in table admin_users.
After 5 wrong passwords the email is locked for 15 minutes.
