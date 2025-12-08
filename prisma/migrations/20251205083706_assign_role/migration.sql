-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('ADMIN', 'STAFF', 'MENTOR', 'MEMBER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "AppRole" NOT NULL DEFAULT 'MEMBER';
