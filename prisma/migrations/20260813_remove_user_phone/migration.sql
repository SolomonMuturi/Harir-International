-- Drop index on phone column
DROP INDEX `users_phone_idx` ON `users`;

-- Remove phone column from users table
ALTER TABLE `users` DROP COLUMN `phone`;
