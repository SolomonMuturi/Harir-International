-- AlterTable
ALTER TABLE `weight_entries` ADD COLUMN `gate_entry_id` VARCHAR(50) NULL,
    ADD COLUMN `updated_at` DATETIME(0) NULL,
    ALTER COLUMN `fruit_variety` DROP DEFAULT;

-- CreateTable
CREATE TABLE `vehicle_visits` (
    `id` VARCHAR(20) NOT NULL,
    `supplier_id` VARCHAR(20) NOT NULL,
    `visit_number` INTEGER NOT NULL DEFAULT 1,
    `vehicle_plate` VARCHAR(20) NOT NULL,
    `driver_name` VARCHAR(100) NULL,
    `driver_id_number` VARCHAR(50) NULL,
    `cargo_description` LONGTEXT NULL,
    `fruit_varieties` LONGTEXT NULL,
    `region` VARCHAR(100) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Pre-registered',
    `gate_entry_id` VARCHAR(50) NULL,
    `gate_entry_number` INTEGER NULL,
    `gate_entry_date` VARCHAR(8) NULL,
    `is_recheck_in` BOOLEAN NULL DEFAULT false,
    `previous_gate_entry_id` VARCHAR(50) NULL,
    `registered_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `check_in_time` DATETIME(0) NULL,
    `check_out_time` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `weight_entry_id` VARCHAR(20) NULL,

    UNIQUE INDEX `vehicle_visits_gate_entry_id_key`(`gate_entry_id`),
    INDEX `vehicle_visits_supplier_id_idx`(`supplier_id`),
    INDEX `vehicle_visits_vehicle_plate_idx`(`vehicle_plate`),
    INDEX `vehicle_visits_status_idx`(`status`),
    INDEX `vehicle_visits_check_in_time_idx`(`check_in_time`),
    INDEX `vehicle_visits_registered_at_idx`(`registered_at`),
    INDEX `vehicle_visits_gate_entry_id_idx`(`gate_entry_id`),
    INDEX `vehicle_visits_gate_entry_date_idx`(`gate_entry_date`),
    UNIQUE INDEX `vehicle_visits_supplier_id_visit_number_key`(`supplier_id`, `visit_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Driver` (
    `id` VARCHAR(191) NOT NULL,
    `driver_name` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `vehicle_plate` VARCHAR(191) NOT NULL,
    `vehicle_type` VARCHAR(191) NOT NULL DEFAULT 'Truck',
    `id_number` VARCHAR(191) NOT NULL,
    `arrival_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `check_in_time` DATETIME(3) NOT NULL,
    `check_out_time` DATETIME(3) NULL,
    `cargo_description` VARCHAR(191) NULL,
    `gate_location` VARCHAR(191) NOT NULL DEFAULT 'Main Gate',
    `registration_type` VARCHAR(191) NOT NULL DEFAULT 'Gate Registration',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Driver_driver_name_key`(`driver_name`),
    UNIQUE INDEX `Driver_phone_number_key`(`phone_number`),
    UNIQUE INDEX `Driver_vehicle_plate_key`(`vehicle_plate`),
    INDEX `Driver_driver_name_idx`(`driver_name`),
    INDEX `Driver_phone_number_idx`(`phone_number`),
    INDEX `Driver_vehicle_plate_idx`(`vehicle_plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `weight_entries_gate_entry_id_idx` ON `weight_entries`(`gate_entry_id`);

-- AddForeignKey
ALTER TABLE `vehicle_visits` ADD CONSTRAINT `vehicle_visits_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_visits` ADD CONSTRAINT `vehicle_visits_weight_entry_id_fkey` FOREIGN KEY (`weight_entry_id`) REFERENCES `weight_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
