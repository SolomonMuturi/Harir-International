/*
  Warnings:

  - The primary key for the `loading_pallets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `loading_sheets` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `loading_pallets` DROP FOREIGN KEY `loading_pallets_loading_sheet_id_fkey`;

-- AlterTable
ALTER TABLE `loading_pallets` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(255) NOT NULL,
    MODIFY `loading_sheet_id` VARCHAR(255) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `loading_sheets` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(255) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `loading_pallets` ADD CONSTRAINT `loading_pallets_loading_sheet_id_fkey` FOREIGN KEY (`loading_sheet_id`) REFERENCES `loading_sheets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
