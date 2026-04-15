/*
  Warnings:

  - A unique constraint covering the columns `[supplier_id,visit_number]` on the table `vehicle_visits` will be added. If there are existing duplicate values, this will fail.
  - Made the column `supplier_id` on table `vehicle_visits` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `vehicle_visits` DROP FOREIGN KEY `vehicle_visits_supplier_id_fkey`;

-- AlterTable
ALTER TABLE `vehicle_visits` MODIFY `supplier_id` VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `vehicle_visits_supplier_id_visit_number_key` ON `vehicle_visits`(`supplier_id`, `visit_number`);

-- AddForeignKey
ALTER TABLE `vehicle_visits` ADD CONSTRAINT `vehicle_visits_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
