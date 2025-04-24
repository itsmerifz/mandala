-- AlterTable
ALTER TABLE `user` ADD COLUMN `ratingId` INTEGER NULL,
    ADD COLUMN `ratingLong` VARCHAR(191) NULL,
    ADD COLUMN `ratingShort` VARCHAR(191) NULL;
