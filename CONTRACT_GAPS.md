# CONTRACT GAPS

This file tracks missing or incomplete API endpoints based on the Meal Direct OpenAPI specification and the Admin UI requirements.

### **Authentication & Session**
- [ ] OAuth integration natively through Supabase is not fully wired on the frontend. The `NEXT_PUBLIC_SUPABASE_URL` and anon keys require configuration and a dedicated `@supabase/ssr` middleware.

### **Dashboard**
- [ ] `GET /v1/admin/dashboard` is used partially by fetching orders, vendors, and students individually and aggregating on the client. A dedicated endpoint that performs aggregation on the backend would improve performance and correctness.

### **Subscriptions**
- [ ] There is no documented `GET /v1/admin/subscriptions` in the backend API documentation context provided. The frontend relies on a local mocked store list.

### **Settings and Notifications**
- [ ] `PATCH /v1/me` and `PUT /v1/notifications/preferences` need proper schema alignment based on user payload. We are defaulting to mock state for now.

### **PWA specific operations**
- [ ] Offline synchronization of administrative operations (like assigning an order or approving a vendor) isn't supported by the generic idempotency key handling out of the box because `serviceWorker` integration requires persistent background sync APIs, which are blocked or unavailable natively on iOS installed PWAs without extensive fallback work.

We have applied graceful fallbacks wherein if the actual API endpoint fails (e.g. `api.mealdirectly.com/docs` routing fails, or CORS blocks dev proxy), the store immediately degrades to offline-first local mode so that the UI can continue to be evaluated and previewed without freezing into empty data states.
