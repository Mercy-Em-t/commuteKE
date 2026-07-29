# Routing & Role Architecture

## Role-Based Redirect on Login

After a user verifies their OTP, the app reads the `userRole` from `localStorage` (set by `AuthContext` after fetching from Supabase) and redirects to the appropriate destination:

| Role | Destination | Description |
|------|-------------|-------------|
| `SYSTEM_ADMIN` | `/sadmin` | TM Savannah system console — SACCO registry, identity provisioning, inquiry inbox |
| `ADMIN` | `/admin` | Sacco-level operations dashboard — trip reports, analytics |
| `DRIVER` | `/driver` | Driver portal — trip status updates, GPS streaming |

### Where this is implemented

- **`AuthContext.jsx`** — After fetching the role from the `user_roles` Supabase table, stores it in `localStorage.userRole` and `localStorage.isSystemAdmin`
- **`Login.jsx`** — Reads `localStorage.userRole` post-OTP and maps it to a destination URL via the `destinations` object:

```js
const destinations = {
    'SYSTEM_ADMIN': '/sadmin',
    'ADMIN':        '/admin',
    'DRIVER':       '/driver',
};
window.location.href = destinations[role] || '/admin';
```

### Adding a new role

1. Add the role to the `CHECK` constraint in `user_roles`:
```sql
ALTER TABLE user_roles DROP CONSTRAINT user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
CHECK (role IN ('ADMIN', 'DRIVER', 'SYSTEM_ADMIN', 'NEW_ROLE'));
```
2. Create the page and add a route in `App.jsx`
3. Add the role → destination mapping in `Login.jsx`
4. Add a `ProtectedRoute` or custom guard in `App.jsx`

---

## Route Map

| URL | Component | Guard | Who can access |
|-----|-----------|-------|----------------|
| `/` | `LandingPage` | None | Public |
| `/routes` | `RouteSelector` | None | Public |
| `/track/:id` | `PassengerView` | None | Public |
| `/login` | `Login` | None | Public |
| `/admin` | `AdminReport` | `ProtectedRoute(ADMIN)` | ADMIN, SYSTEM_ADMIN |
| `/roster` `/operations` | `AdminDashboard` | `ProtectedRoute(ADMIN)` | ADMIN, SYSTEM_ADMIN |
| `/driver` | `DriverPortal` | `ProtectedRoute(DRIVER)` | DRIVER |
| `/sadmin` | `SuperAdminDashboard` | `SuperAdminRoute` | SYSTEM_ADMIN only |
| `/admin/sandbox` | `Sandbox` | None (URL-obscured) | Dev / SYSTEM_ADMIN |

> **Note:** `SuperAdminRoute` checks `userRole?.role === 'SYSTEM_ADMIN'` after the auth loading state resolves. It waits for the Supabase role fetch to complete before making any redirect decision — fixing the race condition that previously kicked SYSTEM_ADMIN users to `/`.

---

## Auth Loading Race Condition Fix

`AuthContext` previously called `setLoading(false)` immediately after invoking `fetchRole()`, before the async Supabase query completed. This meant route guards saw `userRole = null` even for authenticated users, causing instant redirects.

**Fix:** `setLoading(false)` is now called **inside** `fetchRole()`, after `setUserRole()` has been called with the real role data.

```js
const fetchRole = async (userId) => {
    const { data } = await supabase.from('user_roles')...
    setUserRole(...);
    setLoading(false); // ← fires AFTER role is known
};
```
