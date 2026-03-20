/*
  Warnings:

  - You are about to alter the column `variety` on the `cold_room_boxes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `box_type` on the `cold_room_boxes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - You are about to alter the column `size` on the `cold_room_boxes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `grade` on the `cold_room_boxes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `cold_room_id` on the `cold_room_boxes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `pallet_id` on the `cold_room_boxes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `region` on the `cold_room_boxes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to drop the `rejection_records` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `cold_room_boxes` ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `variety` VARCHAR(50) NOT NULL,
    MODIFY `box_type` VARCHAR(10) NOT NULL,
    MODIFY `size` VARCHAR(20) NOT NULL,
    MODIFY `grade` VARCHAR(20) NOT NULL,
    MODIFY `cold_room_id` VARCHAR(50) NOT NULL,
    MODIFY `supplier_name` VARCHAR(255) NULL,
    MODIFY `pallet_id` VARCHAR(100) NULL,
    MODIFY `region` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `counting_records` ADD COLUMN `boxes_loaded_to_coldroom` LONGTEXT NULL,
    ADD COLUMN `cold_room_loaded_to` VARCHAR(50) NULL,
    ADD COLUMN `driver_name` VARCHAR(255) NULL,
    ADD COLUMN `loading_progress_percentage` INTEGER NULL DEFAULT 0,
    ADD COLUMN `total_boxes_loaded` INTEGER NULL DEFAULT 0,
    ADD COLUMN `vehicle_plate` VARCHAR(50) NULL,
    MODIFY `for_coldroom` BOOLEAN NULL DEFAULT true,
    MODIFY `status` VARCHAR(191) NULL DEFAULT 'pending_coldroom';

-- DropTable
DROP TABLE `rejection_records`;

-- CreateIndex
CREATE INDEX `cold_room_boxes_pallet_id_idx` ON `cold_room_boxes`(`pallet_id`);

-- CreateIndex
CREATE INDEX `cold_room_boxes_created_at_idx` ON `cold_room_boxes`(`created_at`);

-- CreateIndex
CREATE INDEX `counting_records_for_coldroom_idx` ON `counting_records`(`for_coldroom`);

-- CreateIndex
CREATE INDEX `counting_records_status_idx` ON `counting_records`(`status`);

-- CreateIndex
CREATE INDEX `counting_records_loaded_to_coldroom_at_idx` ON `counting_records`(`loaded_to_coldroom_at`);

-- AddForeignKey
ALTER TABLE `cold_room_boxes` ADD CONSTRAINT `cold_room_boxes_counting_record_id_fkey` FOREIGN KEY (`counting_record_id`) REFERENCES `counting_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
