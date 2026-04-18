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

export const harvestLogs = sqliteTable("harvest_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  harvestDate: text("harvest_date").notNull(),
  quantityTrays: integer("quantity_trays").notNull(),
  source: text("source", { enum: ["fresh", "cooler"] }).notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(salesOrders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
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
