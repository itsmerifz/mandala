-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('TEXT', 'SLIDE');

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "type" "ModuleType" NOT NULL DEFAULT 'TEXT';
