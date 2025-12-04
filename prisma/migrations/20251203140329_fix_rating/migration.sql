/*
  Warnings:

  - You are about to drop the column `rating` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "rating",
ADD COLUMN     "ratingId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "ratingLong" TEXT,
ADD COLUMN     "ratingShort" TEXT;
