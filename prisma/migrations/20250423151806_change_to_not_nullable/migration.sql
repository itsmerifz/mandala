/*
  Warnings:

  - Made the column `ratingId` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ratingLong` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ratingShort` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `ratingId` INTEGER NOT NULL,
    MODIFY `ratingLong` VARCHAR(191) NOT NULL,
    MODIFY `ratingShort` VARCHAR(191) NOT NULL;
