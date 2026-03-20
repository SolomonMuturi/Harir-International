-- AlterTable
ALTER TABLE `weight_entries` MODIFY `id` VARCHAR(20) NOT NULL DEFAULT LEFT(UUID(), 20);

-- AlterTable
ALTER TABLE `weight_entry_varieties` MODIFY `id` VARCHAR(20) NOT NULL DEFAULT LEFT(UUID(), 20);
