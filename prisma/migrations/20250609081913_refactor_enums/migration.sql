/*
  Warnings:

  - The values [MANAGE_WEB,MANAGE_ROSTER,MANAGE_EVENT,READ_TRAINING,READ_EVENTS,READ_ROSTER] on the enum `Permission` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Permission_new" AS ENUM ('ADMINISTRATOR', 'MANAGE_WEBSITE', 'MANAGE_USERS_ROSTER', 'MANAGE_TRAINING', 'MANAGE_EVENTS', 'MANAGE_FACILITIES', 'MANAGE_COMMUNICATIONS', 'MANAGE_OPERATIONS', 'VIEW_ALL_DATA', 'VIEW_TRAINING_RECORDS', 'VIEW_EVENT_RECORDS', 'VIEW_ROSTER');
ALTER TABLE "RolePermission" ALTER COLUMN "permission" TYPE "Permission_new" USING ("permission"::text::"Permission_new");
ALTER TYPE "Permission" RENAME TO "Permission_old";
ALTER TYPE "Permission_new" RENAME TO "Permission";
DROP TYPE "Permission_old";
COMMIT;
