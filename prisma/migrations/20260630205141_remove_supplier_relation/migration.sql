/*
  Warnings:

  - You are about to drop the column `status` on the `rejects` table. All the data in the column will be lost.
  - You are about to drop the column `supplier_id` on the `vehicle_visits` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `vehicle_visits` DROP FOREIGN KEY `vehicle_visits_supplier_id_fkey`;

-- DropIndex
DROP INDEX `vehicle_visits_supplier_id_visit_number_key` ON `vehicle_visits`;

-- AlterTable
ALTER TABLE `activity_logs` ADD COLUMN `metadata` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `rejects` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `vehicle_visits` DROP COLUMN `supplier_id`,
    ADD COLUMN `company_name` VARCHAR(100) NULL,
    ADD COLUMN `contact_phone` VARCHAR(20) NULL,
    ADD COLUMN `location` VARCHAR(100) NULL,
    ADD COLUMN `vehicle_type` VARCHAR(50) NULL,
    MODIFY `vehicle_plate` VARCHAR(20) NULL;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(20) NOT NULL,
    `user_id` VARCHAR(100) NULL,
    `action` TEXT NULL,
    `table_name` VARCHAR(100) NULL,
    `record_id` VARCHAR(100) NULL,
    `old_values` LONGTEXT NULL,
    `new_values` LONGTEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `activity_logs_timestamp_idx` ON `activity_logs`(`timestamp`);

-- CreateIndex
CREATE INDEX `activity_logs_status_idx` ON `activity_logs`(`status`);

-- CreateIndex
CREATE INDEX `activity_logs_user_idx` ON `activity_logs`(`user`);

-- CreateIndex
CREATE INDEX `vehicle_visits_company_name_idx` ON `vehicle_visits`(`company_name`);

-- CreateIndex
CREATE INDEX `vehicle_visits_driver_name_idx` ON `vehicle_visits`(`driver_name`);

-- CreateIndex
CREATE INDEX `vehicle_visits_contact_phone_idx` ON `vehicle_visits`(`contact_phone`);
