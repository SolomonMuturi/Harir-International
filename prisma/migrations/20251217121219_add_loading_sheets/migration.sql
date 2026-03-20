-- AlterTable
ALTER TABLE `loading_history` ADD COLUMN `box_id` VARCHAR(191) NULL,
    ADD COLUMN `box_type` VARCHAR(191) NULL,
    ADD COLUMN `grade` VARCHAR(191) NULL,
    ADD COLUMN `quantity` INTEGER NULL,
    ADD COLUMN `region` VARCHAR(191) NULL,
    ADD COLUMN `size` VARCHAR(191) NULL,
    ADD COLUMN `variety` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `loading_sheets` (
    `id` VARCHAR(20) NOT NULL,
    `exporter` VARCHAR(255) NOT NULL,
    `client` VARCHAR(255) NOT NULL,
    `shipping_line` VARCHAR(255) NOT NULL,
    `bill_number` VARCHAR(100) NOT NULL,
    `container` VARCHAR(100) NOT NULL,
    `seal1` VARCHAR(100) NOT NULL,
    `seal2` VARCHAR(100) NOT NULL,
    `truck` VARCHAR(100) NOT NULL,
    `vessel` VARCHAR(100) NOT NULL,
    `eta_msa` DATETIME(3) NULL,
    `etd_msa` DATETIME(3) NULL,
    `port` VARCHAR(100) NOT NULL,
    `eta_port` DATETIME(3) NULL,
    `temp_rec1` VARCHAR(50) NOT NULL,
    `temp_rec2` VARCHAR(50) NOT NULL,
    `loading_date` DATETIME(3) NOT NULL,
    `loaded_by` VARCHAR(255) NULL,
    `checked_by` VARCHAR(255) NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loading_pallets` (
    `id` VARCHAR(20) NOT NULL,
    `loading_sheet_id` VARCHAR(20) NOT NULL,
    `pallet_no` INTEGER NOT NULL,
    `temp` VARCHAR(50) NULL,
    `trace_code` VARCHAR(100) NULL,
    `size12` INTEGER NOT NULL DEFAULT 0,
    `size14` INTEGER NOT NULL DEFAULT 0,
    `size16` INTEGER NOT NULL DEFAULT 0,
    `size18` INTEGER NOT NULL DEFAULT 0,
    `size20` INTEGER NOT NULL DEFAULT 0,
    `size22` INTEGER NOT NULL DEFAULT 0,
    `size24` INTEGER NOT NULL DEFAULT 0,
    `size26` INTEGER NOT NULL DEFAULT 0,
    `size28` INTEGER NOT NULL DEFAULT 0,
    `size30` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `loading_history_box_id_idx` ON `loading_history`(`box_id`);

-- CreateIndex
CREATE INDEX `loading_history_variety_idx` ON `loading_history`(`variety`);

-- CreateIndex
CREATE INDEX `loading_history_box_type_idx` ON `loading_history`(`box_type`);

-- AddForeignKey
ALTER TABLE `loading_pallets` ADD CONSTRAINT `loading_pallets_loading_sheet_id_fkey` FOREIGN KEY (`loading_sheet_id`) REFERENCES `loading_sheets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
