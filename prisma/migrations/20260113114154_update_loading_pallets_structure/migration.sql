-- AlterTable
ALTER TABLE `loading_pallets` ADD COLUMN `box_type` VARCHAR(10) NULL,
    ADD COLUMN `cold_room_id` VARCHAR(50) NULL,
    ADD COLUMN `counting_record_id` VARCHAR(255) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `grade` VARCHAR(20) NULL,
    ADD COLUMN `original_pallet_id` VARCHAR(255) NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `region` VARCHAR(100) NULL,
    ADD COLUMN `size` VARCHAR(20) NULL,
    ADD COLUMN `supplier_name` VARCHAR(255) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `variety` VARCHAR(50) NULL;

-- CreateIndex
CREATE INDEX `loading_pallets_cold_room_id_idx` ON `loading_pallets`(`cold_room_id`);

-- CreateIndex
CREATE INDEX `loading_pallets_original_pallet_id_idx` ON `loading_pallets`(`original_pallet_id`);

-- CreateIndex
CREATE INDEX `loading_pallets_counting_record_id_idx` ON `loading_pallets`(`counting_record_id`);

-- CreateIndex
CREATE INDEX `loading_pallets_supplier_name_idx` ON `loading_pallets`(`supplier_name`);

-- CreateIndex
CREATE INDEX `loading_pallets_variety_idx` ON `loading_pallets`(`variety`);

-- CreateIndex
CREATE INDEX `loading_pallets_box_type_idx` ON `loading_pallets`(`box_type`);
