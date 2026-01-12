/*
  Warnings:

  - You are about to drop the column `box_type` on the `cold_room_pallets` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `cold_room_pallets` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `cold_room_pallets` table. All the data in the column will be lost.
  - You are about to drop the column `variety` on the `cold_room_pallets` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `cold_room_pallets_box_type_idx` ON `cold_room_pallets`;

-- DropIndex
DROP INDEX `cold_room_pallets_variety_idx` ON `cold_room_pallets`;

-- AlterTable
ALTER TABLE `cold_room_pallets` DROP COLUMN `box_type`,
    DROP COLUMN `grade`,
    DROP COLUMN `size`,
    DROP COLUMN `variety`,
    ADD COLUMN `boxes_per_pallet` INTEGER NOT NULL DEFAULT 288,
    ADD COLUMN `is_manual` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `total_boxes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `total_weight_kg` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `pallet_count` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `cold_room_boxes_variety_idx` ON `cold_room_boxes`(`variety`);

-- CreateIndex
CREATE INDEX `cold_room_boxes_box_type_idx` ON `cold_room_boxes`(`box_type`);

-- CreateIndex
CREATE INDEX `cold_room_boxes_size_idx` ON `cold_room_boxes`(`size`);

-- CreateIndex
CREATE INDEX `cold_room_boxes_grade_idx` ON `cold_room_boxes`(`grade`);

-- CreateIndex
CREATE INDEX `cold_room_pallets_pallet_name_idx` ON `cold_room_pallets`(`pallet_name`);

-- CreateIndex
CREATE INDEX `cold_room_pallets_is_manual_idx` ON `cold_room_pallets`(`is_manual`);

-- CreateIndex
CREATE INDEX `cold_room_pallets_total_boxes_idx` ON `cold_room_pallets`(`total_boxes`);

-- CreateIndex
CREATE INDEX `cold_room_pallets_total_weight_kg_idx` ON `cold_room_pallets`(`total_weight_kg`);
