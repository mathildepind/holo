# HOLO - Harvest and Order Logistics Operations

## What is HOLO?

HOLO is an operations UI concept for Hippo Harvest's pack-and-ship floor. It gives the user a single place to see today's harvest against committed orders, walk each order through a scan-based pack verification, and hand off a generated Bill of Lading to the carrier — replacing the spreadsheet + clipboard flow documented in the [workflow gist](https://gist.github.com/fea0b04ea59a1ad50a56a343f6ed50fa).

The prototype in [`holo/`](holo/) implements the three core views end-to-end:

- **Dashboard** (`/dashboard`) — today's harvest + cooler inventory vs. committed orders, with a today/tomorrow split and short-inventory alerts
- **Pack Verify** (`/pack`) — scan-driven pack verification for open orders; newly packed BOLs persist to `localStorage`
- **Order History** (`/orders`) — past orders and the BOLs generated for them

Data is a static in-memory fixture seeded from the case-study CSVs (`customer_orders.csv`, `customer_order_items.csv`, `inventory_scans.csv`, in [`sample data/`](sample%20data/)) and anchored to a simulated "today" of **2025-03-10, 05:00**.

## Deliverables

- [`PRD/PRD_HOLO.pdf`](PRD/PRD_HOLO.pdf) — product requirements document ([Typst source](PRD/PRD_HOLO.typ))
- [`PRD/HOLO_Data_Model.md`](PRD/HOLO_Data_Model.md) — target data model with a v1 prototype scope note

## Stack

- Next.js 14 (App Router) + TypeScript + React 18
- API routes under `holo/src/app/api/{inventory,orders,bols}` serve the fixture data
- Vitest for route-level tests
- Plain CSS (no Tailwind runtime) — design tokens live in `holo/src/app/globals.css`

## Running locally

```bash
cd holo
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
cd holo
npm test
```

## Key files

- `holo/src/lib/mock-data.ts` — fixture, CSV-derived seed data, and `getInventoryAvailability` / `getOpenOrders` helpers
- `holo/src/lib/types.ts` — domain types (orders, pack records, BOLs, inventory)
- `holo/src/app/(shell)/` — the three UI routes
- `holo/src/app/api/` — JSON endpoints consumed by the client views
