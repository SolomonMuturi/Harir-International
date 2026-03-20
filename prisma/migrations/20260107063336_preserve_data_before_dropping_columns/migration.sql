/*
  Warnings:

  - You are about to drop the column `fuerte_crates` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `fuerte_weight` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `hass_crates` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `hass_weight` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `jumbo_crates` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `jumbo_weight` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `mixed_crates` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `mixed_weight` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `other_crates` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `other_variety` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `other_weight` on the `weight_entries` table. All the data in the column will be lost.
  - The primary key for the `weight_entry_varieties` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `weight_entries` DROP COLUMN `fuerte_crates`,
    DROP COLUMN `fuerte_weight`,
    DROP COLUMN `hass_crates`,
    DROP COLUMN `hass_weight`,
    DROP COLUMN `jumbo_crates`,
    DROP COLUMN `jumbo_weight`,
    DROP COLUMN `mixed_crates`,
    DROP COLUMN `mixed_weight`,
    DROP COLUMN `other_crates`,
    DROP COLUMN `other_variety`,
    DROP COLUMN `other_weight`;

-- AlterTable
ALTER TABLE `weight_entry_varieties` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE INDEX `weight_entries_pallet_id_idx` ON `weight_entries`(`pallet_id`);

-- CreateIndex
CREATE INDEX `weight_entries_supplier_idx` ON `weight_entries`(`supplier`);

-- CreateIndex
CREATE INDEX `weight_entries_timestamp_idx` ON `weight_entries`(`timestamp`);
