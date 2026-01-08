/*
  Warnings:

  - The primary key for the `weight_entry_varieties` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `weight_entries` ADD COLUMN `fuerte_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `fuerte_weight` DECIMAL(10, 2) NULL,
    ADD COLUMN `hass_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `hass_weight` DECIMAL(10, 2) NULL,
    ALTER COLUMN `id` DROP DEFAULT;

-- AlterTable
ALTER TABLE `weight_entry_varieties` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `weight` DECIMAL(10, 2) NULL,
    MODIFY `crates` INTEGER NULL DEFAULT 0,
    ADD PRIMARY KEY (`id`);
