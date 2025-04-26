/*
  Warnings:

  - You are about to drop the column `isOnTraining` on the `certificate` table. All the data in the column will be lost.
  - You are about to drop the column `issuedAt` on the `certificate` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `certificate` table. All the data in the column will be lost.
  - You are about to drop the column `upgradedAt` on the `certificate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `certificate` DROP FOREIGN KEY `Certificate_userId_fkey`;

-- DropIndex
DROP INDEX `Certificate_userId_code_idx` ON `certificate`;

-- AlterTable
ALTER TABLE `certificate` DROP COLUMN `isOnTraining`,
    DROP COLUMN `issuedAt`,
    DROP COLUMN `notes`,
    DROP COLUMN `upgradedAt`;

-- CreateTable
CREATE TABLE `UserCertificate` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `certificateId` VARCHAR(191) NOT NULL,
    `isOnTraining` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `upgradedAt` DATETIME(3) NULL,

    UNIQUE INDEX `UserCertificate_userId_certificateId_key`(`userId`, `certificateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Certificate_code_key` ON `Certificate`(`code`);

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_certificateId_fkey` FOREIGN KEY (`certificateId`) REFERENCES `Certificate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
