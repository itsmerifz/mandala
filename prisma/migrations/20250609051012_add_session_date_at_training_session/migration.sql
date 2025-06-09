/*
  Warnings:

  - Added the required column `sessionDate` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TrainingSession" ADD COLUMN     "sessionDate" TIMESTAMP(3) NOT NULL;
