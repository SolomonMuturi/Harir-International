-- CreateTable
CREATE TABLE `carriers` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `contact_name` VARCHAR(100) NULL,
    `contact_email` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `rating` FLOAT NULL DEFAULT 0,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `id_number` VARCHAR(50) NULL,
    `vehicle_registration` VARCHAR(20) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `carriers_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `performance` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `contract` VARCHAR(191) NOT NULL,
    `salary` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `id_number` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `issue_date` DATETIME(0) NULL,
    `expiry_date` DATETIME(0) NULL,
    `company` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts_receivable` (
    `id` VARCHAR(20) NOT NULL,
    `customer_id` VARCHAR(20) NULL,
    `invoice_id` VARCHAR(100) NULL,
    `amount` DECIMAL(12, 2) NULL,
    `due_date` DATE NULL,
    `aging_status` ENUM('On Time', 'At Risk', 'Late') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `customer_id`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(20) NOT NULL,
    `user` VARCHAR(100) NULL,
    `avatar` VARCHAR(255) NULL,
    `action` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `timestamp` DATETIME(0) NULL,
    `status` ENUM('success', 'failure', 'pending') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anomalies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `metric_name` VARCHAR(100) NULL,
    `metric_value` DECIMAL(10, 2) NULL,
    `expected_value` DECIMAL(10, 2) NULL,
    `timestamp` DATETIME(0) NULL,
    `additional_context` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cold_room_inventory` (
    `id` VARCHAR(20) NOT NULL,
    `product` VARCHAR(100) NOT NULL,
    `category` ENUM('Fruit', 'Vegetable', 'Flower', 'Other') NOT NULL,
    `quantity` INTEGER NULL,
    `unit` ENUM('pallets', 'tonnes', 'boxes', 'crates') NOT NULL,
    `location` VARCHAR(100) NULL,
    `entry_date` DATETIME(0) NULL,
    `current_weight` DECIMAL(10, 2) NULL,
    `reorder_threshold` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cold_rooms` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `temperature` DECIMAL(4, 1) NULL,
    `humidity` DECIMAL(4, 1) NULL,
    `status` ENUM('Optimal', 'Warning', 'Alert') NOT NULL,
    `zone_type` ENUM('Fruit', 'Vegetable', 'Flower') NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` VARCHAR(20) NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(100) NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `is_primary` BOOLEAN NULL DEFAULT false,

    INDEX `customer_id`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) NULL,
    `tags` LONGTEXT NULL,
    `logo_url` VARCHAR(255) NULL,
    `website` VARCHAR(100) NULL,
    `ytd_sales` DECIMAL(12, 2) NULL,
    `last_order` DATE NULL,
    `status` ENUM('active', 'inactive', 'new') NOT NULL,
    `outstanding_balance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `open_invoices` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dwell_times` (
    `id` VARCHAR(20) NOT NULL,
    `location` VARCHAR(100) NULL,
    `primary_product` VARCHAR(100) NULL,
    `avg_dwell_time` VARCHAR(50) NULL,
    `items` INTEGER NULL,
    `status` ENUM('optimal', 'moderate', 'high') NOT NULL,
    `next_action` TEXT NULL,
    `entry_date` DATETIME(0) NULL,
    `weight` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `variety` VARCHAR(100) NULL,
    `storage_temp` DECIMAL(4, 1) NULL,
    `category` ENUM('Fruit', 'Vegetable', 'Flower', 'Other') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotes` (
    `id` VARCHAR(20) NOT NULL,
    `quote_id` VARCHAR(100) NULL,
    `customer_id` VARCHAR(20) NULL,
    `date` DATE NULL,
    `valid_until` DATE NULL,
    `amount` DECIMAL(12, 2) NULL,
    `status` ENUM('Draft', 'Sent', 'Accepted', 'Expired') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `quote_id`(`quote_id`),
    INDEX `customer_id`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipments` (
    `id` VARCHAR(20) NOT NULL,
    `shipment_id` VARCHAR(50) NOT NULL,
    `customer_id` VARCHAR(20) NULL,
    `origin` VARCHAR(100) NULL,
    `destination` VARCHAR(100) NULL,
    `status` ENUM('Awaiting QC', 'Processing', 'Receiving', 'Preparing for Dispatch', 'Ready for Dispatch', 'In-Transit', 'Delivered', 'Delayed') NOT NULL,
    `product` VARCHAR(100) NULL,
    `tags` VARCHAR(100) NULL,
    `weight` VARCHAR(50) NULL,
    `carrier` VARCHAR(100) NULL,
    `carrier_id` VARCHAR(20) NULL,
    `expected_arrival` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `shipment_id`(`shipment_id`),
    INDEX `customer_id`(`customer_id`),
    INDEX `carrier_id`(`carrier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) NULL,
    `contact_name` VARCHAR(100) NULL,
    `contact_email` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `produce_types` LONGTEXT NULL,
    `status` ENUM('Active', 'Inactive', 'Onboarding') NOT NULL,
    `logo_url` VARCHAR(255) NULL,
    `active_contracts` INTEGER NULL DEFAULT 0,
    `kra_pin` VARCHAR(20) NULL,
    `supplier_code` VARCHAR(20) NULL,
    `vehicle_number_plate` VARCHAR(20) NULL,
    `driver_name` VARCHAR(100) NULL,
    `driver_id_number` VARCHAR(50) NULL,
    `mpesa_paybill` VARCHAR(20) NULL,
    `mpesa_account_number` VARCHAR(50) NULL,
    `bank_name` VARCHAR(100) NULL,
    `bank_account_number` VARCHAR(50) NULL,
    `password` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `supplier_code`(`supplier_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitors` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `company` VARCHAR(100) NULL,
    `host_id` VARCHAR(20) NULL,
    `id_number` VARCHAR(50) NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `visitor_code` VARCHAR(50) NULL,
    `vehicle_plate` VARCHAR(20) NULL,
    `vehicle_type` VARCHAR(50) NULL,
    `cargo_description` TEXT NULL,
    `reason_for_visit` TEXT NULL,
    `status` ENUM('Pre-registered', 'Checked-in', 'Checked-out', 'Pending Exit') NOT NULL,
    `expected_check_in_time` DATETIME(0) NULL,
    `check_in_time` DATETIME(0) NULL,
    `check_out_time` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `visitor_code`(`visitor_code`),
    INDEX `host_id`(`host_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weight_entries` (
    `id` VARCHAR(20) NOT NULL,
    `pallet_id` VARCHAR(100) NULL,
    `product` VARCHAR(100) NULL,
    `weight` DECIMAL(10, 2) NULL,
    `unit` ENUM('kg', 'lb') NOT NULL,
    `timestamp` DATETIME(0) NULL,
    `supplier` VARCHAR(100) NULL,
    `truck_id` VARCHAR(100) NULL,
    `driver_id` VARCHAR(100) NULL,
    `gross_weight` DECIMAL(10, 2) NULL,
    `tare_weight` DECIMAL(10, 2) NULL,
    `net_weight` DECIMAL(10, 2) NULL,
    `declared_weight` DECIMAL(10, 2) NULL,
    `rejected_weight` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts_receivable` ADD CONSTRAINT `accounts_receivable_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `customer_contacts` ADD CONSTRAINT `customer_contacts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitors` ADD CONSTRAINT `visitors_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
