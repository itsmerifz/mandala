/*
  Warnings:

  - You are about to drop the column `userId` on the `certificate` table. All the data in the column will be lost.
  - Added the required column `color` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `certificate` DROP COLUMN `userId`,
    ADD COLUMN `color` VARCHAR(191) NOT NULL;
