// Apple-inspired palette
#let ink = rgb("#1d1d1f")
#let ink-secondary = rgb("#6e6e73")
#let ink-tertiary = rgb("#86868b")
#let rule = rgb("#d2d2d7")
#let surface = rgb("#f5f5f7")
#let accent-red = rgb("#e8705a")
#let accent-red-soft = rgb("#fdeae4")
#let accent-green = rgb("#4aae6a")
#let accent-green-soft = rgb("#e6f4ea")
#let accent-blue = rgb("#0071e3")

#set page(paper: "us-letter", margin: (x: 1in, y: 1in))
#set text(
  font: ("Helvetica Neue", "Helvetica"),
  size: 10.5pt,
  fill: ink,
)
#set par(justify: false, leading: 0.78em, spacing: 1.1em)

#show heading.where(level: 1): it => block(above: 1.9em, below: 0.7em)[
  #text(
    font: ("Helvetica Neue", "Helvetica"),
    size: 15pt,
    weight: "semibold",
    tracking: -0.02em,
    fill: ink,
    it.body,
  )
]
#show heading.where(level: 2): it => block(above: 1.2em, below: 0.4em)[
  #text(
    font: ("Helvetica Neue", "Helvetica"),
    size: 12pt,
    weight: "semibold",
    tracking: -0.01em,
    fill: ink,
    it.body,
  )
]

#show emph: it => text(style: "italic", fill: ink-secondary, it.body)

// Table styling: no outer box, hairline horizontal separators
#set table(
  inset: (x: 10pt, y: 8pt),
  stroke: (x, y) => (
    top: if y == 0 { 0.6pt + ink } else { 0.4pt + rule },
    bottom: 0.4pt + rule,
  ),
)

#align(center)[
  #text(
    font: ("Helvetica Neue", "Helvetica"),
    size: 28pt,
    weight: "bold",
    tracking: -0.04em,
  )[HOLO]
  #v(-0.2em)
  #text(
    font: ("Helvetica Neue", "Helvetica"),
    size: 13pt,
    weight: "regular",
    tracking: -0.01em,
    fill: ink-secondary,
  )[Harvest and Order Logistics Operations]
  #v(-0.3em)
  #text(
    size: 10pt,
    fill: ink-tertiary,
    tracking: 0.02em,
  )[Hippo Harvest · Product Requirements · April 2026]
]

#v(1.2em)

= Problem

The handoff from robot-harvested product to delivered, invoiced order is largely manual. The current process holds at three customers and two to three shipments per week, but most of the coordination sits in Maria's head, in Google Chat, and in Google Docs. Scaling to more customers and daily shipments would require additional headcount to maintain the spreadsheets.

Three handoffs in the chain are not currently supported by tooling:

#set list(marker: [·])
- *Harvest → Pack.* Each morning the ops manager reconciles the overnight harvest against open orders using Google Chat messages from the software team and a harvest spreadsheet that typically runs two days stale. _"I carry every tray and every order in my head."_
- *Pack → Ship.* BOLs are Google Docs filled in by hand; each shipment takes 20 to 30 minutes. The quantities are drawn from the sales order rather than from what was actually packed, so the BOL the customer receives frequently disagrees with the shipment itself.
- *Ship → Invoice.* Business systems reconciles shipped quantities against orders manually, a day or more after delivery. Discrepancies surface at invoice time, if at all. BOLs remain email attachments and cannot be queried.

Two adjacent concerns are worth noting, even though they are out of scope for v1. First, food traceability: a recall would currently have to be reconstructed from email threads. Second, larger retail customers would expect to see documented workflows during onboarding.

= Users

#table(
  columns: (auto, 1.2fr, 1.6fr),
  align: (left, left, left),
  table.header(
    [*Role*], [*What's manual today*], [*What HOLO covers*],
  ),
  [Maria Chen \ Ops Manager], [Reconciles harvest, cooler, and open orders from five sources each morning], [Dashboard: today's harvest + cooler against committed orders, with the gap computed],
  [Mikey Torrance \ Director of Logistics], [20–30 min per BOL; quantities sourced from the order, not the pack], [Pack Verify captures packed quantities; BOL pre-fills from that record],
  [Priya Anand \ Business Systems Engineer], [BOLs in email threads; reconciliation runs a day or more after delivery], [BOL records persisted and queryable by date, customer, order, or crop],
)

= Solution

An internal web app with three views backed by a shared datastore:

+ *Inventory & Orders Dashboard* — today's harvest and cooler inventory against orders scheduled for delivery today and tomorrow, with per-product gap and short-inventory flags.
+ *Pack Verify* — the operator picks an open order and scans each box into it; packed vs. ordered quantity is compared inline and discrepancies are flagged before the pack record is locked.
+ *BOL & Order History* — a BOL is generated from the locked pack record, exported as PDF, and stored as a queryable row.

The three views share one chain of foreign keys: #text(font: ("Menlo", "Monaco"), size: 9.5pt)[inventory_scan → pack_item → pack_record → bill_of_lading → shipment]. A BOL can be traced back to the individual box scans it covers.

= Success metrics

#table(
  columns: (1.4fr, 1fr, 1fr),
  align: (left, left, left),
  table.header(
    [*Metric*], [*Baseline*], [*Target*],
  ),
  [Time to generate a BOL], [20–30 min], [\~5 min],
  [Quantity mismatches on BOL], [Caught at invoicing, if at all], [Flagged at Pack Verify (100%)],
  [Invoice reconciliation], [Manual cross-reference, 1+ day lag], [Query BOL records, same-day],
  [Queryable audit trail], [None — Google Docs in email], [Every BOL stored + queryable],
)

= Buy vs. build

Grow ERP, a produce-specific supply-chain platform with a QuickBooks integration, was evaluated and set aside. Its data model does not map cleanly onto the crop-cycle and harvest-batch concepts already in use internally, its integrations would still require ongoing maintenance, and most of its surface area addresses functionality that is not needed at three customers.

A narrower internal tool preserves the option to revisit the platform decision once volumes are higher and the requirements are better defined. At that point the tradeoffs will warrant reassessment.

= Scope (v1 prototype)

*In:* Dashboard, Pack Verify, BOL generation and PDF export, queryable BOL history, seeded from the case-study CSVs.

*Out:* QuickBooks integration, Retool and Airflow migration, real-time sensor ingestion, auth and roles, email delivery of BOLs, mobile layout.

= Path to production

*Experiment loop.* Run HOLO against one real order per week for three weeks. Track the metrics in the table above and collect qualitative feedback from Maria, Mikey, and Priya at the end of each week. The decision point at week three is whether the measured reductions in time and error are sufficient to justify moving from prototype to production.

*Milestones.*

#table(
  columns: (auto, 1fr, auto),
  align: (left, left, left),
  table.header(
    [*Phase*], [*Focus*], [*Duration*],
  ),
  [1. Discovery], [Map the current order lifecycle end-to-end; confirm the data model with stakeholders], [\~2 days],
  [2. Design], [Data-flow design and interface wireframes; review with stakeholders], [\~3 days],
  [3. Build], [Prototype against mock data — pack verification flow and BOL generation], [\~5 days],
  [4. Internal review], [Demo to Maria, Mikey, and Priya; gather feedback and adjust], [\~2 days],
  [5. Experiment], [Run with one real order per week; measure the metrics above], [3 weeks],
  [6. Evaluate], [Go / no-go decision for production based on the experiment results], [\~2 days],
)

#pagebreak()

#align(center)[
  #text(
    font: ("Helvetica Neue", "Helvetica"),
    size: 18pt,
    weight: "semibold",
    tracking: -0.02em,
    fill: ink,
  )[Screens]
]

#v(0.6em)

#let screen-caption(label, body) = [
  #v(4pt)
  #text(size: 9pt, fill: ink-secondary)[
    #text(weight: "semibold", fill: ink)[#label] — #body
  ]
]

#align(center)[
  #image("screens/dashboard.png", height: 2.6in, fit: "contain")
]
#screen-caption("Dashboard", [today's harvest + cooler against open orders, gap computed per product])

#v(6pt)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 14pt,
  [
    #align(center)[#image("screens/pack_verify.png", height: 1.8in, fit: "contain")]
    #screen-caption("Pack Verify", [packed quantities logged against the order])
  ],
  [
    #align(center)[#image("screens/pack_locked.png", height: 1.8in, fit: "contain")]
    #screen-caption("Pack record locked", [verified; BOL generation unlocks])
  ],
)

#v(6pt)

#align(center)[
  #image("screens/order_history.png", height: 1.9in, fit: "contain")
]
#screen-caption("Order History", [past orders with the generated BOL stored as a queryable row])

#pagebreak()

#align(center)[
  #text(
    font: ("Helvetica Neue", "Helvetica"),
    size: 18pt,
    weight: "semibold",
    tracking: -0.02em,
    fill: ink,
  )[Current flow]
]

#v(0.6em)

#align(center)[
  #image("holo_current.png", height: 6.5in, fit: "contain")
]

#v(8pt)

#block(inset: (x: 2pt))[
  #text(size: 9pt, fill: ink-secondary)[
    #text(weight: "semibold", fill: ink)[Figure 1. Current outbound workflow.] Production runs overnight and records each box into #text(font: ("Menlo", "Monaco"), size: 8.5pt)[inventory_scans]. In the morning Maria reconciles rough counts from Google Chat, a harvest spreadsheet that typically runs two days stale, and the open orders, keeping most of the reconciliation in her head while the floor packs. Mikey completes a Google Doc BOL by hand, populated from ordered rather than packed quantities, and emails it to the carrier and the customer. At the end of the week Priya reconciles Retool summaries against the sales order, corrects any mismatches, and pushes invoices to QuickBooks a day or more after delivery. Red nodes indicate the steps the interviews identify as manual, stale, or mismatched.
  ]
]

#pagebreak()

#align(center)[
  #text(
    font: ("Helvetica Neue", "Helvetica"),
    size: 18pt,
    weight: "semibold",
    tracking: -0.02em,
    fill: ink,
  )[Proposed flow — HOLO]
]

#v(0.6em)

#align(center)[
  #image("holo_proposed.png", height: 6.5in, fit: "contain")
]

#v(8pt)

#block(inset: (x: 2pt))[
  #text(size: 9pt, fill: ink-secondary)[
    #text(weight: "semibold", fill: ink)[Figure 2. Proposed workflow with HOLO.] The same four actors and physical steps are retained. The three manual handoffs are replaced by the three HOLO views (Dashboard, Pack Verification, BOL Generation), backed by a shared datastore that ties #text(font: ("Menlo", "Monaco"), size: 8.5pt)[inventory_scans] to #text(font: ("Menlo", "Monaco"), size: 8.5pt)[pack_items] to #text(font: ("Menlo", "Monaco"), size: 8.5pt)[pack_records] to #text(font: ("Menlo", "Monaco"), size: 8.5pt)[bills_of_lading]. Dark-green nodes represent the new HOLO surfaces. Light-green nodes represent downstream effects, such as faster pack planning for Maria and same-day invoice turnaround for Priya, that follow from the BOL being a queryable row rather than an email attachment.
  ]
]
