-- Add security fields to users table
ALTER TABLE `users` ADD COLUMN `lastLogin` DATETIME(3) NULL,
    ADD COLUMN `lockedUntil` DATETIME(3) NULL,
    ADD COLUMN `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorSecret` VARCHAR(191) NULL;

-- Add indexes to user_roles table
CREATE INDEX `user_roles_createdAt_idx` ON `user_roles`(`createdAt`);
CREATE INDEX `user_roles_isDefault_idx` ON `user_roles`(`isDefault`);

-- Add index to users table for email
CREATE INDEX `users_email_idx` ON `users`(`email`);

-- Safely drop and recreate foreign key (if needed)
ALTER TABLE `users` DROP FOREIGN KEY IF EXISTS `users_roleId_fkey`;
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `user_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for roleId
CREATE INDEX `users_roleId_idx` ON `users`(`roleId`);