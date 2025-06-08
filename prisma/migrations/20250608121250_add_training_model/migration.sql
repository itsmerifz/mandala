-- CreateTable
CREATE TABLE `Training` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('RATING_PROGESSION', 'SOLO_ENDORSEMENT', 'RECURRENT_TRAINING') NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `mentorId` VARCHAR(191) NULL,
    `assignedById` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Training_studentId_idx`(`studentId`),
    INDEX `Training_mentorId_idx`(`mentorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingRatingDetail` (
    `id` VARCHAR(191) NOT NULL,
    `trainingId` VARCHAR(191) NOT NULL,
    `targetRating` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TrainingRatingDetail_trainingId_key`(`trainingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingSoloDetail` (
    `id` VARCHAR(191) NOT NULL,
    `trainingId` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `validUntil` DATETIME(3) NULL,

    UNIQUE INDEX `TrainingSoloDetail_trainingId_key`(`trainingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingSession` (
    `id` VARCHAR(191) NOT NULL,
    `trainingId` VARCHAR(191) NOT NULL,
    `mentorId` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrainingSession_trainingId_idx`(`trainingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Training` ADD CONSTRAINT `Training_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Training` ADD CONSTRAINT `Training_mentorId_fkey` FOREIGN KEY (`mentorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Training` ADD CONSTRAINT `Training_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingRatingDetail` ADD CONSTRAINT `TrainingRatingDetail_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `Training`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingSoloDetail` ADD CONSTRAINT `TrainingSoloDetail_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `Training`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingSession` ADD CONSTRAINT `TrainingSession_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `Training`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingSession` ADD CONSTRAINT `TrainingSession_mentorId_fkey` FOREIGN KEY (`mentorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
