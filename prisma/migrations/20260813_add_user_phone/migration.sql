-- Add phone number to users table
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(191) NULL;

-- Add index for phone (optional, for searching)
CREATE INDEX `users_phone_idx` ON `users`(`phone`);
