/*
  Warnings:

  - You are about to drop the column `status` on the `rejects` table. All the data in the column will be lost.
  - You are about to drop the column `supplier_id` on the `vehicle_visits` table. All the data in the column will be lost.

*/
-- DropForeignKey (safe drop - ignore if not exists)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'vehicle_visits_supplier_id_fkey' AND TABLE_NAME = 'vehicle_visits');
SET @stmt = IF(@fk_exists > 0, 'ALTER TABLE `vehicle_visits` DROP FOREIGN KEY `vehicle_visits_supplier_id_fkey`', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- DropIndex (safe drop - ignore if not exists)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'vehicle_visits_supplier_id_visit_number_key' AND TABLE_NAME = 'vehicle_visits');
SET @stmt = IF(@idx_exists > 0, 'DROP INDEX `vehicle_visits_supplier_id_visit_number_key` ON `vehicle_visits`', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AlterTable - add metadata column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'metadata');
SET @stmt = IF(@col_exists = 0, 'ALTER TABLE `activity_logs` ADD COLUMN `metadata` LONGTEXT NULL', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AlterTable
ALTER TABLE `rejects` DROP COLUMN IF EXISTS `status`;

-- AlterTable - handle vehicle_visits changes carefully
-- Drop supplier_id column if it still exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_visits' AND COLUMN_NAME = 'supplier_id');
SET @stmt = IF(@col_exists > 0, 'ALTER TABLE `vehicle_visits` DROP COLUMN `supplier_id`', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add company_name if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_visits' AND COLUMN_NAME = 'company_name');
SET @stmt = IF(@col_exists = 0, 'ALTER TABLE `vehicle_visits` ADD COLUMN `company_name` VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add contact_phone if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_visits' AND COLUMN_NAME = 'contact_phone');
SET @stmt = IF(@col_exists = 0, 'ALTER TABLE `vehicle_visits` ADD COLUMN `contact_phone` VARCHAR(20) NULL', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add location if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_visits' AND COLUMN_NAME = 'location');
SET @stmt = IF(@col_exists = 0, 'ALTER TABLE `vehicle_visits` ADD COLUMN `location` VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add vehicle_type if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_visits' AND COLUMN_NAME = 'vehicle_type');
SET @stmt = IF(@col_exists = 0, 'ALTER TABLE `vehicle_visits` ADD COLUMN `vehicle_type` VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify vehicle_plate to be nullable
SET @col_type = (SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_visits' AND COLUMN_NAME = 'vehicle_plate');
SET @stmt = IF(@col_type IS NOT NULL, 'ALTER TABLE `vehicle_visits` MODIFY `vehicle_plate` VARCHAR(20) NULL', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CreateTable
CREATE TABLE IF NOT EXISTS `audit_logs` (
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

-- CreateIndex (safe create - ignore if already exists)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'activity_logs_timestamp_idx' AND TABLE_NAME = 'activity_logs');
SET @stmt = IF(@idx_exists = 0, 'CREATE INDEX `activity_logs_timestamp_idx` ON `activity_logs`(`timestamp`)', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CreateIndex
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'activity_logs_status_idx' AND TABLE_NAME = 'activity_logs');
SET @stmt = IF(@idx_exists = 0, 'CREATE INDEX `activity_logs_status_idx` ON `activity_logs`(`status`)', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CreateIndex
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'activity_logs_user_idx' AND TABLE_NAME = 'activity_logs');
SET @stmt = IF(@idx_exists = 0, 'CREATE INDEX `activity_logs_user_idx` ON `activity_logs`(`user`)', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CreateIndex
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'vehicle_visits_company_name_idx' AND TABLE_NAME = 'vehicle_visits');
SET @stmt = IF(@idx_exists = 0, 'CREATE INDEX `vehicle_visits_company_name_idx` ON `vehicle_visits`(`company_name`)', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CreateIndex
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'vehicle_visits_driver_name_idx' AND TABLE_NAME = 'vehicle_visits');
SET @stmt = IF(@idx_exists = 0, 'CREATE INDEX `vehicle_visits_driver_name_idx` ON `vehicle_visits`(`driver_name`)', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- CreateIndex
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'vehicle_visits_contact_phone_idx' AND TABLE_NAME = 'vehicle_visits');
SET @stmt = IF(@idx_exists = 0, 'CREATE INDEX `vehicle_visits_contact_phone_idx` ON `vehicle_visits`(`contact_phone`)', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
