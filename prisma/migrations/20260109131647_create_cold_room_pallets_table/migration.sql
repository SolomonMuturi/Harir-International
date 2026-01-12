-- CreateTable
CREATE TABLE `cold_room_pallets` (
    `id` VARCHAR(191) NOT NULL,
    `variety` VARCHAR(50) NOT NULL,
    `box_type` VARCHAR(10) NOT NULL,
    `size` VARCHAR(20) NOT NULL,
    `grade` VARCHAR(20) NOT NULL,
    `pallet_count` INTEGER NOT NULL DEFAULT 0,
    `cold_room_id` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_updated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cold_room_pallets_cold_room_id_idx`(`cold_room_id`),
    INDEX `cold_room_pallets_variety_idx`(`variety`),
    INDEX `cold_room_pallets_box_type_idx`(`box_type`),
    INDEX `cold_room_pallets_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
