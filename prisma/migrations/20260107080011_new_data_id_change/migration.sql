/*
  Warnings:

  - The primary key for the `weight_entry_varieties` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `weight_entry_varieties` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE `weight_entries` MODIFY `id` VARCHAR(20) NOT NULL DEFAULT LEFT(UUID(), 20);

-- AlterTable
ALTER TABLE `weight_entry_varieties` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(20) NOT NULL DEFAULT LEFT(UUID(), 20),
    ADD PRIMARY KEY (`id`);
