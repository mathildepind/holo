# HOLO

Operations UI prototype for Hippo Harvest — a single-screen flow that walks a user from open orders through pack verification to a generated Bill of Lading.

Built as an interview demo. Data is a static in-memory fixture seeded from the case-study CSVs (`customer_orders.csv`, `customer_order_items.csv`, `inventory_scans.csv`) and anchored to a simulated "today" of **2025-03-10, 05:00**.

## Views

- **Dashboard** (`/dashboard`) — today's harvest + cooler inventory vs. committed orders, with a today/tomorrow split and a short-inventory alert.
- **Pack Verify** (`/pack`) — scan-driven pack verification for open orders; newly packed BOLs persist to `localStorage`.
- **Order History** (`/orders`) — past orders and their generated BOLs.

## Stack

- Next.js 14 (App Router) + TypeScript + React 18
- API routes under `src/app/api/{inventory,orders,bols}` serve the fixture data
- Vitest for route-level tests
- Plain CSS (no Tailwind runtime) — design tokens live in `src/app/globals.css`

## Running locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

## Key files

- `src/lib/mock-data.ts` — fixture, CSV-derived seed data, and `getInventoryAvailability` / `getOpenOrders` helpers
- `src/lib/types.ts` — domain types (orders, pack records, BOLs, inventory)
- `src/app/(shell)/` — the three UI routes
- `src/app/api/` — JSON endpoints consumed by the client views
