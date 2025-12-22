-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('ONCE', 'RECURRING');

-- AlterTable
ALTER TABLE "AgencyTask" ADD COLUMN     "reminderType" "ReminderType",
ADD COLUMN     "reminderTime" TEXT,
ADD COLUMN     "recurrenceRule" TEXT,
ADD COLUMN     "notifyVia" TEXT[],
ADD COLUMN     "snoozedUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AgencyTask_snoozedUntil_idx" ON "AgencyTask"("snoozedUntil");
