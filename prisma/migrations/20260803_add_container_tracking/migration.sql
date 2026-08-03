-- CreateTable
CREATE TABLE `containers` (
    `id` VARCHAR(20) NOT NULL,
    `shipment_number` VARCHAR(100) NOT NULL,
    `invoice_number` VARCHAR(100) NULL,
    `bl_number` VARCHAR(100) NULL,
    `container_number` VARCHAR(100) NOT NULL,
    `current_location` VARCHAR(200) NULL,
    `current_temperature` VARCHAR(20) NULL,
    `arrival_date` DATETIME(0) NULL,
    `destination` VARCHAR(200) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `containers_shipment_number_key`(`shipment_number`),
    UNIQUE INDEX `containers_container_number_key`(`container_number`),
    INDEX `containers_arrival_date_idx`(`arrival_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `container_updates` (
    `id` VARCHAR(20) NOT NULL,
    `container_id` VARCHAR(20) NOT NULL,
    `current_location` VARCHAR(200) NULL,
    `current_temperature` VARCHAR(20) NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `container_updates_container_id_idx`(`container_id`),
    INDEX `container_updates_updated_at_idx`(`updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `container_updates` ADD CONSTRAINT `container_updates_container_id_fkey` FOREIGN KEY (`container_id`) REFERENCES `containers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
