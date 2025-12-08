-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "isSelection" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ExamSubmission" ADD COLUMN     "appExpectation" TEXT,
ADD COLUMN     "appReason" TEXT,
ADD COLUMN     "generatedCode" TEXT;
