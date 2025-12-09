-- CreateIndex
CREATE INDEX "ExamSubmission_generatedCode_idx" ON "ExamSubmission"("generatedCode");

-- CreateIndex
CREATE INDEX "TrainingSession_mentorId_idx" ON "TrainingSession"("mentorId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_ratingId_idx" ON "User"("ratingId");

-- CreateIndex
CREATE INDEX "User_cid_idx" ON "User"("cid");
