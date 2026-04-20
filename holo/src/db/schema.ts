import { relations } from "drizzle-orm";
import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  packSize: text("pack_size").notNull(),
  unitPrice: real("unit_price").notNull(),
  caseWeightLb: real("case_weight_lb").notNull(),
  scanPrefix: text("scan_prefix").notNull(),
});

export const salesOrders = sqliteTable("sales_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  poNumber: text("po_number").notNull(),
  requestedDelivery: text("requested_delivery").notNull(),
  plannedShip: text("planned_ship").notNull(),
  status: text("status", {
    enum: ["entered", "fulfilled", "released", "delivered"],
  }).notNull(),
  enteredAt: text("entered_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => salesOrders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantityOrdered: integer("quantity_ordered").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull(),
});

export const packRecords = sqliteTable("pack_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => salesOrders.id),
  status: text("status", { enum: ["draft", "verified", "locked"] }).notNull(),
  packedBy: text("packed_by").notNull(),
  notes: text("notes").notNull(),
  verifiedAt: text("verified_at"),
});

export const packItems = sqliteTable("pack_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  packRecordId: integer("pack_record_id")
    .notNull()
    .references(() => packRecords.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantityPacked: integer("quantity_packed").notNull(),
  discrepancyNote: text("discrepancy_note"),
});

export const inventoryScans = sqliteTable("inventory_scans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scanCode: text("scan_code").notNull().unique(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  batchCode: text("batch_code").notNull(),
  packItemId: integer("pack_item_id").references(() => packItems.id),
  scannedAt: text("scanned_at").notNull(),
  checkoutAt: text("checkout_at"),
  isProduction: integer("is_production", { mode: "boolean" }).notNull(),
  isDonation: integer("is_donation", { mode: "boolean" }).notNull(),
  isCheckoutOverridden: integer("is_checkout_overridden", { mode: "boolean" }).notNull(),
  isAddedInFulfillment: integer("is_added_in_fulfillment", { mode: "boolean" }).notNull(),
});

export const carriers = sqliteTable("carriers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["internal", "external"] }).notNull(),
});

export const shipments = sqliteTable("shipments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  carrierId: integer("carrier_id")
    .notNull()
    .references(() => carriers.id),
  shipDate: text("ship_date").notNull(),
  status: text("status", { enum: ["scheduled", "in_transit", "delivered"] }).notNull(),
  departedAt: text("departed_at"),
  deliveredAt: text("delivered_at"),
});

export const billsOfLading = sqliteTable("bills_of_lading", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bolNumber: text("bol_number").notNull().unique(),
  packRecordId: integer("pack_record_id")
    .notNull()
    .references(() => packRecords.id),
  shipmentId: integer("shipment_id")
    .notNull()
    .references(() => shipments.id),
  palletCount: integer("pallet_count").notNull(),
  totalWeight: real("total_weight").notNull(),
  tempRequirements: text("temp_requirements").notNull(),
  generatedBy: text("generated_by").notNull(),
  generatedAt: text("generated_at").notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(salesOrders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  inventoryScans: many(inventoryScans),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(salesOrders, {
    fields: [orderItems.orderId],
    references: [salesOrders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const packRecordsRelations = relations(packRecords, ({ one, many }) => ({
  order: one(salesOrders, {
    fields: [packRecords.orderId],
    references: [salesOrders.id],
  }),
  items: many(packItems),
  bol: one(billsOfLading, {
    fields: [packRecords.id],
    references: [billsOfLading.packRecordId],
  }),
}));

export const packItemsRelations = relations(packItems, ({ one, many }) => ({
  packRecord: one(packRecords, {
    fields: [packItems.packRecordId],
    references: [packRecords.id],
  }),
  product: one(products, {
    fields: [packItems.productId],
    references: [products.id],
  }),
  scans: many(inventoryScans),
}));

export const inventoryScansRelations = relations(inventoryScans, ({ one }) => ({
  product: one(products, {
    fields: [inventoryScans.productId],
    references: [products.id],
  }),
  packItem: one(packItems, {
    fields: [inventoryScans.packItemId],
    references: [packItems.id],
  }),
}));

export const carriersRelations = relations(carriers, ({ many }) => ({
  shipments: many(shipments),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  carrier: one(carriers, {
    fields: [shipments.carrierId],
    references: [carriers.id],
  }),
  bols: many(billsOfLading),
}));

export const billsOfLadingRelations = relations(billsOfLading, ({ one }) => ({
  packRecord: one(packRecords, {
    fields: [billsOfLading.packRecordId],
    references: [packRecords.id],
  }),
  shipment: one(shipments, {
    fields: [billsOfLading.shipmentId],
    references: [shipments.id],
  }),
}));
