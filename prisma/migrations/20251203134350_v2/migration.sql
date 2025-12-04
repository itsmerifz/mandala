/*
  Warnings:

  - You are about to drop the column `accessToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `session_token` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `assignedById` on the `Training` table. All the data in the column will be lost.
  - You are about to drop the column `trainingPlan` on the `Training` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Training` table. All the data in the column will be lost.
  - The `status` column on the `Training` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `notes` on the `TrainingSession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionDate` on the `TrainingSession` table. All the data in the column will be lost.
  - You are about to drop the column `permissionsLastUpdatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ratingId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ratingLong` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ratingShort` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isOnTraining` on the `UserCertificate` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `UserCertificate` table. All the data in the column will be lost.
  - You are about to drop the column `upgradedAt` on the `UserCertificate` table. All the data in the column will be lost.
  - You are about to drop the `CompetencyItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompetencySection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompetencyTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SessionCompetencyResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingRatingDetail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventParticipants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserRole` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessionToken]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionToken` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RosterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOA', 'VISITOR', 'SUSPENDED', 'RESIDENT');

-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "SessionRating" AS ENUM ('UNSATISFACTORY', 'SATISFACTORY', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('IN_PROGRESS', 'PENDING_REVIEW', 'PASSED', 'FAILED');

-- DropForeignKey
ALTER TABLE "CompetencyItem" DROP CONSTRAINT "CompetencyItem_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencySection" DROP CONSTRAINT "CompetencySection_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_createdById_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "SessionCompetencyResult" DROP CONSTRAINT "SessionCompetencyResult_competencyItemId_fkey";

-- DropForeignKey
ALTER TABLE "SessionCompetencyResult" DROP CONSTRAINT "SessionCompetencyResult_trainingSessionId_fkey";

-- DropForeignKey
ALTER TABLE "Training" DROP CONSTRAINT "Training_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "TrainingRatingDetail" DROP CONSTRAINT "TrainingRatingDetail_trainingId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingSession" DROP CONSTRAINT "TrainingSession_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "UserCertificate" DROP CONSTRAINT "UserCertificate_certificateId_fkey";

-- DropForeignKey
ALTER TABLE "_EventParticipants" DROP CONSTRAINT "_EventParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventParticipants" DROP CONSTRAINT "_EventParticipants_B_fkey";

-- DropForeignKey
ALTER TABLE "_UserRole" DROP CONSTRAINT "_UserRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserRole" DROP CONSTRAINT "_UserRole_B_fkey";

-- DropIndex
DROP INDEX "Session_session_token_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken",
ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "expires_at" INTEGER,
ADD COLUMN     "id_token" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "session_state" TEXT,
ADD COLUMN     "token_type" TEXT;

-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "color",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "session_token",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sessionToken" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Training" DROP COLUMN "assignedById",
DROP COLUMN "trainingPlan",
DROP COLUMN "type",
ADD COLUMN     "title" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TrainingStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "TrainingSession" DROP COLUMN "notes",
DROP COLUMN "sessionDate",
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "privateNote" TEXT,
ADD COLUMN     "rating" "SessionRating" NOT NULL DEFAULT 'SATISFACTORY',
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "permissionsLastUpdatedAt",
DROP COLUMN "ratingId",
DROP COLUMN "ratingLong",
DROP COLUMN "ratingShort",
ADD COLUMN     "division" TEXT,
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "rosterStatus" "RosterStatus" NOT NULL DEFAULT 'VISITOR',
ADD COLUMN     "subdivision" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserCertificate" DROP COLUMN "isOnTraining",
DROP COLUMN "notes",
DROP COLUMN "upgradedAt",
ADD COLUMN     "issuerId" TEXT,
ADD COLUMN     "status" "CertStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "validUntil" TIMESTAMP(3);

-- DropTable
DROP TABLE "CompetencyItem";

-- DropTable
DROP TABLE "CompetencySection";

-- DropTable
DROP TABLE "CompetencyTemplate";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "Resource";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "RolePermission";

-- DropTable
DROP TABLE "SessionCompetencyResult";

-- DropTable
DROP TABLE "TrainingRatingDetail";

-- DropTable
DROP TABLE "_EventParticipants";

-- DropTable
DROP TABLE "_UserRole";

-- DropEnum
DROP TYPE "EventStatus";

-- DropEnum
DROP TYPE "MentorInputLevel";

-- DropEnum
DROP TYPE "PerformanceLevel";

-- DropEnum
DROP TYPE "Permission";

-- DropEnum
DROP TYPE "TrainingType";

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "minRating" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 80,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSubmission" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "adminFeedback" TEXT,

    CONSTRAINT "ExamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "textAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_moduleId_key" ON "Exam"("moduleId");

-- CreateIndex
CREATE INDEX "ExamSubmission_userId_idx" ON "ExamSubmission"("userId");

-- CreateIndex
CREATE INDEX "ExamSubmission_examId_idx" ON "ExamSubmission"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_userId_courseId_key" ON "CourseProgress"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "UserCertificate_userId_idx" ON "UserCertificate"("userId");

-- AddForeignKey
ALTER TABLE "UserCertificate" ADD CONSTRAINT "UserCertificate_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertificate" ADD CONSTRAINT "UserCertificate_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExamSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "QuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
