CREATE TABLE `bills_of_lading` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bol_number` text NOT NULL,
	`pack_record_id` integer NOT NULL,
	`shipment_id` integer NOT NULL,
	`pallet_count` integer NOT NULL,
	`total_weight` real NOT NULL,
	`temp_requirements` text NOT NULL,
	`generated_by` text NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`pack_record_id`) REFERENCES `pack_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bills_of_lading_bol_number_unique` ON `bills_of_lading` (`bol_number`);--> statement-breakpoint
CREATE TABLE `carriers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`address` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_scans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scan_code` text NOT NULL,
	`product_id` integer NOT NULL,
	`batch_code` text NOT NULL,
	`pack_item_id` integer,
	`scanned_at` text NOT NULL,
	`checkout_at` text,
	`is_production` integer NOT NULL,
	`is_donation` integer NOT NULL,
	`is_checkout_overridden` integer NOT NULL,
	`is_added_in_fulfillment` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pack_item_id`) REFERENCES `pack_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_scans_scan_code_unique` ON `inventory_scans` (`scan_code`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity_ordered` integer NOT NULL,
	`unit_price` real NOT NULL,
	`discount` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pack_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pack_record_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity_packed` integer NOT NULL,
	`discrepancy_note` text,
	FOREIGN KEY (`pack_record_id`) REFERENCES `pack_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pack_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text NOT NULL,
	`packed_by` text NOT NULL,
	`notes` text NOT NULL,
	`verified_at` text,
	FOREIGN KEY (`order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`pack_size` text NOT NULL,
	`unit_price` real NOT NULL,
	`case_weight_lb` real NOT NULL,
	`scan_prefix` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `sales_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`po_number` text NOT NULL,
	`requested_delivery` text NOT NULL,
	`planned_ship` text NOT NULL,
	`status` text NOT NULL,
	`entered_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`carrier_id` integer NOT NULL,
	`ship_date` text NOT NULL,
	`status` text NOT NULL,
	`departed_at` text,
	`delivered_at` text,
	FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON UPDATE no action ON DELETE no action
);
