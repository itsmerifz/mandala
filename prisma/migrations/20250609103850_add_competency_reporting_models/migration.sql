-- CreateEnum
CREATE TYPE "MentorInputLevel" AS ENUM ('CONSTANT', 'RARE', 'NO_INPUT', 'NOT_COVERED');

-- CreateEnum
CREATE TYPE "PerformanceLevel" AS ENUM ('BELOW', 'AT', 'ABOVE');

-- CreateTable
CREATE TABLE "CompetencyTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetRating" TEXT NOT NULL,
    "targetPosition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencySection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "CompetencySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "competency" TEXT NOT NULL,

    CONSTRAINT "CompetencyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCompetencyResult" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "competencyItemId" TEXT NOT NULL,
    "mentorInput" "MentorInputLevel" NOT NULL,
    "performanceLevel" "PerformanceLevel" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "SessionCompetencyResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyTemplate_name_key" ON "CompetencyTemplate"("name");

-- CreateIndex
CREATE INDEX "CompetencySection_templateId_idx" ON "CompetencySection"("templateId");

-- CreateIndex
CREATE INDEX "CompetencyItem_sectionId_idx" ON "CompetencyItem"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCompetencyResult_trainingSessionId_competencyItemId_key" ON "SessionCompetencyResult"("trainingSessionId", "competencyItemId");

-- AddForeignKey
ALTER TABLE "CompetencySection" ADD CONSTRAINT "CompetencySection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CompetencyTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyItem" ADD CONSTRAINT "CompetencyItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CompetencySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCompetencyResult" ADD CONSTRAINT "SessionCompetencyResult_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCompetencyResult" ADD CONSTRAINT "SessionCompetencyResult_competencyItemId_fkey" FOREIGN KEY ("competencyItemId") REFERENCES "CompetencyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
