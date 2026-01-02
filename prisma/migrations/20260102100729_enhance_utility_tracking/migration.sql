-- AlterTable
ALTER TABLE `counting_records` MODIFY `status` VARCHAR(191) NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `rejection_records` ADD COLUMN `status` VARCHAR(191) NULL DEFAULT 'pending_coldroom';

-- AlterTable
ALTER TABLE `utility_readings` ADD COLUMN `metadata` JSON NULL;

-- CreateTable
CREATE TABLE `utility_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utility_type` VARCHAR(50) NOT NULL,
    `rate` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `effective_from` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effective_to` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `utility_rates_utility_type_idx`(`utility_type`),
    INDEX `utility_rates_effective_from_idx`(`effective_from`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `internet_costs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` VARCHAR(100) NOT NULL,
    `monthly_cost` DECIMAL(10, 2) NOT NULL,
    `billing_cycle` VARCHAR(50) NOT NULL,
    `payment_due_date` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `internet_costs_provider_idx`(`provider`),
    INDEX `internet_costs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utility_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(255) NULL,
    `notification_time` VARCHAR(5) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `last_sent` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `utility_notifications_user_id_idx`(`user_id`),
    INDEX `utility_notifications_enabled_idx`(`enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utility_area_consumption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reading_id` INTEGER NULL,
    `area_type` VARCHAR(50) NOT NULL,
    `opening_reading` VARCHAR(50) NULL,
    `closing_reading` VARCHAR(50) NULL,
    `consumed` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `utility_area_consumption_reading_id_idx`(`reading_id`),
    INDEX `utility_area_consumption_area_type_idx`(`area_type`),
    INDEX `utility_area_consumption_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `water_meters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `meter_number` VARCHAR(50) NOT NULL,
    `meter_name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `water_meters_meter_number_key`(`meter_number`),
    INDEX `water_meters_meter_number_idx`(`meter_number`),
    INDEX `water_meters_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generator_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `generator_code` VARCHAR(50) NOT NULL,
    `generator_name` VARCHAR(100) NOT NULL,
    `fuel_rate` DECIMAL(5, 2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `last_service` DATETIME(3) NULL,
    `next_service` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `generator_details_generator_code_key`(`generator_code`),
    INDEX `generator_details_generator_code_idx`(`generator_code`),
    INDEX `generator_details_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_temperatures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `equipment_type` VARCHAR(50) NOT NULL,
    `temperature` DECIMAL(4, 1) NULL,
    `status` VARCHAR(20) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recorded_by` VARCHAR(100) NULL,

    INDEX `equipment_temperatures_equipment_type_idx`(`equipment_type`),
    INDEX `equipment_temperatures_recorded_at_idx`(`recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `rejection_records_status_idx` ON `rejection_records`(`status`);

-- CreateIndex
CREATE INDEX `utility_readings_date_idx` ON `utility_readings`(`date`);

-- CreateIndex
CREATE INDEX `utility_readings_shift_idx` ON `utility_readings`(`shift`);

-- CreateIndex
CREATE INDEX `utility_readings_recordedBy_idx` ON `utility_readings`(`recordedBy`);

-- CreateIndex
CREATE INDEX `utility_readings_createdAt_idx` ON `utility_readings`(`createdAt`);
