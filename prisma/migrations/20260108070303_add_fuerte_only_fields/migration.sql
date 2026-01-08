/*
  Warnings:

  - You are about to drop the column `hass_10kg_class1` on the `counting_records` table. All the data in the column will be lost.
  - You are about to drop the column `hass_10kg_class2` on the `counting_records` table. All the data in the column will be lost.
  - You are about to drop the column `hass_10kg_total` on the `counting_records` table. All the data in the column will be lost.
  - You are about to drop the column `hass_4kg_class1` on the `counting_records` table. All the data in the column will be lost.
  - You are about to drop the column `hass_4kg_class2` on the `counting_records` table. All the data in the column will be lost.
  - You are about to drop the column `hass_4kg_total` on the `counting_records` table. All the data in the column will be lost.
  - You are about to drop the column `hass_class1` on the `quality_checks` table. All the data in the column will be lost.
  - You are about to drop the column `hass_class2` on the `quality_checks` table. All the data in the column will be lost.
  - You are about to drop the column `hass_overall` on the `quality_checks` table. All the data in the column will be lost.
  - You are about to drop the column `hass_crates` on the `weight_entries` table. All the data in the column will be lost.
  - You are about to drop the column `hass_weight` on the `weight_entries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `counting_records` DROP COLUMN `hass_10kg_class1`,
    DROP COLUMN `hass_10kg_class2`,
    DROP COLUMN `hass_10kg_total`,
    DROP COLUMN `hass_4kg_class1`,
    DROP COLUMN `hass_4kg_class2`,
    DROP COLUMN `hass_4kg_total`;

-- AlterTable
ALTER TABLE `quality_checks` DROP COLUMN `hass_class1`,
    DROP COLUMN `hass_class2`,
    DROP COLUMN `hass_overall`;

-- AlterTable
ALTER TABLE `weight_entries` DROP COLUMN `hass_crates`,
    DROP COLUMN `hass_weight`;
