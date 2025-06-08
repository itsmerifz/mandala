/*
  Warnings:

  - The values [RATING_PROGESSION] on the enum `Training_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `training` MODIFY `type` ENUM('RATING_PROGRESSION', 'SOLO_ENDORSEMENT', 'RECURRENT_TRAINING') NOT NULL;
