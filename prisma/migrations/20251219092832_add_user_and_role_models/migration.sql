/*
  Warnings:

  - The primary key for the `utility_readings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `utility_readings` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Int`.
  - Made the column `recordedBy` on table `utility_readings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `utility_readings` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `powerOpening` VARCHAR(191) NOT NULL,
    MODIFY `powerClosing` VARCHAR(191) NOT NULL,
    MODIFY `powerConsumed` VARCHAR(191) NOT NULL,
    MODIFY `waterOpening` VARCHAR(191) NOT NULL,
    MODIFY `waterClosing` VARCHAR(191) NOT NULL,
    MODIFY `waterConsumed` VARCHAR(191) NOT NULL,
    MODIFY `generatorStart` VARCHAR(191) NOT NULL,
    MODIFY `generatorStop` VARCHAR(191) NOT NULL,
    MODIFY `timeConsumed` VARCHAR(191) NOT NULL,
    MODIFY `dieselConsumed` VARCHAR(191) NOT NULL,
    MODIFY `dieselRefill` VARCHAR(191) NULL,
    MODIFY `recordedBy` VARCHAR(191) NOT NULL,
    MODIFY `shift` VARCHAR(191) NULL,
    MODIFY `notes` VARCHAR(191) NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `roleId` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `permissions` JSON NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `user_roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `user_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
