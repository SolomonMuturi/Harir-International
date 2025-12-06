-- CreateTable
CREATE TABLE `quality_checks` (
    `id` VARCHAR(20) NOT NULL,
    `shipment_id` VARCHAR(20) NULL,
    `operator_id` VARCHAR(20) NULL,
    `pallet_id` VARCHAR(100) NULL,
    `product` VARCHAR(100) NULL,
    `declared_weight` DECIMAL(10, 2) NULL,
    `net_weight` DECIMAL(10, 2) NULL,
    `rejected_weight` DECIMAL(10, 2) NULL,
    `accepted_weight` DECIMAL(10, 2) NULL,
    `arrival_temperature` DECIMAL(4, 1) NULL,
    `driver_id` VARCHAR(100) NULL,
    `truck_id` VARCHAR(100) NULL,
    `packaging_status` VARCHAR(50) NULL DEFAULT 'accepted',
    `freshness_status` VARCHAR(50) NULL DEFAULT 'accepted',
    `seals_status` VARCHAR(50) NULL DEFAULT 'accepted',
    `overall_status` VARCHAR(50) NULL DEFAULT 'approved',
    `notes` TEXT NULL,
    `processed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `processed_by` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `clockInTime` VARCHAR(191) NULL,
    `clockOutTime` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Attendance_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `quality_checks` ADD CONSTRAINT `quality_checks_shipment_id_fkey` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
