# Hippo Harvest HOLO
## Harvest and Order Logistics Operations

---

## Problem: What problem is this solving?

We don't always know if what's harvested, packed, and shipped matches what the customer ordered.

Robots harvest overnight, and by 5am the greenhouse operations team is piecing together what's available from Google Chat messages and spreadsheets. The operations manager manually cross-references this against open orders to decide what to pack — a process that relies heavily on institutional knowledge and doesn't scale. As one stakeholder put it: "I kind of carry that in my head. That works today because I know every tray and every order. I don't know how that scales when we triple the number of customers."

Once packing is complete, the logistics team generates a Bill of Lading from a Google Doc template based on *sales order quantities*, not what was actually packed. When discrepancies exist — a quality pull, heavier-than-expected harvest, a last-minute substitution — the BOL doesn't reflect what's on the truck. Customers receive paperwork that doesn't match their delivery, creating trust issues and billing disputes.

Downstream, the business systems team manually reconciles each sales order against shipped quantities before invoicing, often discovering mismatches days after delivery. BOLs live as Google Docs in email threads and are not queryable, making dispute resolution and audit trail reconstruction slow and unreliable.

There is no single place to see what has been harvested, what has been committed to orders, and what still needs to be packed.

## Why: How do we know this is a real problem and worth solving?

The current process creates pain at every handoff:

- **Harvest → Pack:** The operations manager pieces together available inventory (fresh harvest + cooler storage) against open orders using chat messages and spreadsheets. This is error-prone and not auditable. Getting it wrong has immediate physical consequences — over-packing wastes limited cooler space and puts pressure on the next day's harvest; under-packing means last-minute scrambling that pulls people off other tasks.
- **Pack → Ship:** BOL creation takes 20–30 minutes per order and is done manually in a Google Doc template. Because it's based on sales order quantities rather than verified pack data, the BOL may not reflect what's actually on the truck. Customers have reported receiving counts that don't match their packing slips, eroding trust.
- **Ship → Invoice:** The business systems team must manually cross-reference each sales order against shipped quantities before invoicing, often at least a day after delivery. Discrepancies are frequent, and when shipped quantities are systematically lower than invoiced quantities (or vice versa), revenue leakage occurs.
- **Traceability & compliance:** The process produces no queryable record. As a food company, Hippo Harvest needs to trace product from farm to customer. If there were a quality issue or recall, reconstructing what was in a given shipment would be difficult and slow. Larger retail customers will expect to see real systems during procurement reviews — spreadsheets and Google Docs won't hold up.
- **Scaling risk:** The current process works (barely) at three customers with two to three shipments per week. It will not survive daily shipments to twenty customers.

## Success: How do we know if we've solved this problem?

1. There is a single workflow to log what was harvested, verify what was packed against what was ordered, and generate a BOL from verified data.
2. BOL generation takes ~5 minutes (down from 20–30).
3. When a BOL is generated, the data is saved, locked, and queryable — creating a reliable audit trail.
4. Discrepancies between ordered and packed quantities are flagged *before* the BOL is generated, not discovered at invoicing.
5. The business team can pull invoice-ready records without manual cross-referencing.

## Audience: Who are we building for?

| Role | How they use HOLO |
|------|-------------------|
| Greenhouse Operations Manager | Starting at 5am after overnight harvest, sees available inventory (harvested + cooler), views open orders, logs what was packed against each order |
| Logistics Team | Reviews verified pack data, generates and sends BOL to carrier and customer. Currently handles 2–3 shipments/week via own truck + one overflow carrier |
| Business & Accounting | Queries completed shipments for invoice reconciliation against QuickBooks; needs structured, queryable data rather than Google Doc attachments |

## What: What does this look like in the product?

HOLO is an internal web app with three core views:

### 1. Inventory & Orders Dashboard
- Shows current available inventory: freshly harvested trays + cooler stock, broken down by crop
- Shows open orders with required quantities per crop
- Highlights gaps (order requires 50 trays of butterhead, only 40 available)

### 2. Pack Verification
- Operator selects an order and logs what was actually packed (crop, quantity, lot/tray IDs)
- System compares packed quantities against ordered quantities and flags discrepancies
- Operator can add notes (e.g., "substituted green leaf for butterhead, customer approved")
- Once verified, the pack record is locked

### 3. BOL Generation & History
- Generates a BOL from the verified pack data (not the sales order)
- BOL includes: date, order reference, customer, carrier, itemized quantities (ordered vs. packed), pallet count, total weight, temperature requirements, and any notes
- BOL can be exported as PDF and emailed to carrier/customer
- Historical BOLs are queryable by date, customer, order, or crop

### Data Model

The full data model is documented separately (see **HOLO Data Model** document) with entity definitions, field specifications, and rationale for changes from the current database schema.

Key entities: Customers, Products, Sales Orders, Order Items, Harvest Logs, Inventory Scans, Pack Records, Pack Items, Bills of Lading, Shipments, Carriers.

The model addresses several structural gaps in the current schema, including: normalizing customer and product data that is currently stored as free text, introducing a pack verification layer (Pack Records + Pack Items) that doesn't exist today, linking inventory scan codes to products via a scan prefix mapping, replacing the Google Doc BOL workflow with structured queryable records, and adding explicit status fields to replace timestamp-based state inference.

The core design principle is an unbroken traceability chain: Inventory Scans → Pack Items → Pack Records → Bills of Lading → Shipments — enabling farm-to-customer traceability for food safety and audit compliance.

## Scope: What's in and out for the prototype?

### In scope
- Mock data for harvest logs and sales orders
- Pack verification flow (log packed quantities, flag discrepancies)
- BOL generation from verified pack data (PDF export)
- Queryable BOL history

### Out of scope (production considerations)
- Integration with QuickBooks for automated invoicing from verified shipment data
- Migration from existing Retool apps and Airflow jobs
- Integration with existing ERP, accounting, or inventory systems
- Real-time harvest data ingestion (e.g., from sensors or automated spreadsheet sync)
- User authentication and role-based access
- Email/notification delivery of BOLs
- Mobile-optimized interface for use on the greenhouse floor

## Alternatives Considered

**Grow ERP** (produce-specific supply chain platform) was evaluated as a buy option. It offers inventory management, order management, BOL generation, carrier coordination, and QuickBooks integration out of the box, and is used by peer farms.

However, after internal review the team concluded it's more system than Hippo Harvest needs at this stage. Key concerns:

- The data model doesn't map cleanly to how Hippo Harvest thinks about crop cycles and harvest batches.
- Integrations are not as turnkey as they appear — ongoing maintenance would still be required.
- The cost includes features that won't be needed for several years.
- The risk of locking into a platform that doesn't fit and having to work around it outweighs the speed of buying.

The recommendation is to build a targeted internal tool that solves the immediate harvest → pack → ship → invoice data flow, run it as an experiment, and revisit the platform decision once operations scale to twenty or more customers and the requirements are better understood.

## How: What is the experiment plan?

Use HOLO for 1 order per week for 3 weeks, measuring:

| Metric | Baseline | Target |
|--------|----------|--------|
| Time to generate BOL | 20–30 min | ~5 min |
| Discrepancies caught before shipping | Unknown (caught at invoicing) | 100% flagged at pack verification |
| Invoice reconciliation time | Manual cross-referencing per order | Direct query from BOL records |
| User satisfaction | N/A | Qualitative feedback from ops, logistics, and business teams |

After 3 weeks, evaluate whether the workflow reduces errors and time enough to justify production investment.

## When: What are the milestones?

| Phase | Focus | Duration |
|-------|-------|----------|
| 1. Discovery | Map current order lifecycle end-to-end, confirm data model with stakeholders | ~2 days |
| 2. Design | Data flow design, app interface wireframes, review with stakeholders | ~3 days |
| 3. Build | Develop prototype with mock data, pack verification flow, BOL generation | ~5 days |
| 4. Internal review | Demo to stakeholders, gather feedback, adjust | ~2 days |
| 5. Experiment | Run with 1 real order/week for 3 weeks, measure metrics above | 3 weeks |
| 6. Evaluate | Decide go/no-go for production based on experiment results | ~2 days |
