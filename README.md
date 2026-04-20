# HOLO - Harvest and Order Logistics Operations

## What is HOLO?

HOLO is an operations UI concept for Hippo Harvest's pack-and-ship floor. It gives the user a single place to see today's harvest against committed orders, walk each order through a scan-based pack verification, and hand off a generated Bill of Lading to the carrier — replacing the spreadsheet + clipboard flow documented in the [workflow gist](https://gist.github.com/fea0b04ea59a1ad50a56a343f6ed50fa).

The prototype in [`holo/`](holo/) implements the three core views end-to-end:

- **Dashboard** (`/dashboard`) — today's harvest + cooler inventory vs. committed orders, with a today/tomorrow split and short-inventory alerts
- **Pack Verify** (`/pack`) — scan-driven pack verification for open orders; submitting a pack writes a pack record, shipment, and BOL to SQLite in a single transaction
- **Order History** (`/orders`) — past orders and the BOLs generated for them

Data lives in a local SQLite database (`holo/holo.db`) managed with [Drizzle ORM](https://orm.drizzle.team/) and seeded from the case-study CSVs (`customer_orders.csv`, `customer_order_items.csv`, `inventory_scans.csv`, in [`sample data/`](sample%20data/)). The demo is anchored to a simulated "today" of **2025-03-10, 05:00**.

## Deliverables

- [`PRD/PRD_HOLO.pdf`](PRD/PRD_HOLO.pdf) — product requirements document ([Typst source](PRD/PRD_HOLO.typ))
- [`PRD/HOLO_Data_Model.md`](PRD/HOLO_Data_Model.md) — target data model with a v1 prototype scope note

## Stack

- Next.js 14 (App Router) + TypeScript + React 18
- Drizzle ORM + better-sqlite3 for persistence; migrations live in `holo/src/db/migrations/`
- API routes under `holo/src/app/api/{inventory,orders,bols,pack}` serve DB-backed JSON
- Vitest for query- and route-level tests (each test gets a fresh in-memory DB)
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

## Database

The dev server creates `holo/holo.db` on first request, runs migrations, and seeds it from `src/db/seed.ts`. It's gitignored.

Browse the data with Drizzle Studio:

```bash
cd holo
npx drizzle-kit studio
```

Open the URL it prints (`https://local.drizzle.studio`) — the server is local, only the UI is hosted. If the browser tab stays on a loading spinner, enable **Local network** under the site's permissions and hard-refresh.

Reset to a clean seed:

```bash
cd holo
rm -f holo.db*    # stop the dev server and Studio first
npm run dev       # recreates and re-seeds on the next request
```

## Key files

- `holo/src/db/schema.ts` — Drizzle table + relation definitions
- `holo/src/db/queries.ts` — all reads (`getOpenOrders`, `getInventoryAvailability`, `getEnrichedBOLs`) and the transactional `createPackAndBOL` writer
- `holo/src/db/seed.ts` — CSV-derived seed data transcribed for 2025-03-10
- `holo/src/lib/types.ts` — domain types shared by API routes and client views
- `holo/src/app/(shell)/` — the three UI routes
- `holo/src/app/api/` — JSON endpoints consumed by the client views
