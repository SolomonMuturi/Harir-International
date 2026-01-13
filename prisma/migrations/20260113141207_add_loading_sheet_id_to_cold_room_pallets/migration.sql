-- AlterTable
ALTER TABLE `cold_room_pallets` ADD COLUMN `loading_sheet_id` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `cold_room_pallets_loading_sheet_id_idx` ON `cold_room_pallets`(`loading_sheet_id`);

-- AddForeignKey
ALTER TABLE `cold_room_pallets` ADD CONSTRAINT `cold_room_pallets_loading_sheet_id_fkey` FOREIGN KEY (`loading_sheet_id`) REFERENCES `loading_sheets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
