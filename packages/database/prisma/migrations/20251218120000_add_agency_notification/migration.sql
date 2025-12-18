-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'TASK_COMPLETED', 'LEAD_ASSIGNED', 'LEAD_STATUS_CHANGE', 'DEAL_STATUS_CHANGE', 'ACTIVITY_MENTION');

-- CreateTable
CREATE TABLE "AgencyNotification" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "taskId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyNotification_agencyId_idx" ON "AgencyNotification"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyNotification_recipientId_idx" ON "AgencyNotification"("recipientId");

-- CreateIndex
CREATE INDEX "AgencyNotification_isRead_idx" ON "AgencyNotification"("isRead");

-- CreateIndex
CREATE INDEX "AgencyNotification_agencyId_recipientId_isRead_createdAt_idx" ON "AgencyNotification"("agencyId", "recipientId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "AgencyNotification" ADD CONSTRAINT "AgencyNotification_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyNotification" ADD CONSTRAINT "AgencyNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "AgencyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyNotification" ADD CONSTRAINT "AgencyNotification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgencyTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyNotification" ADD CONSTRAINT "AgencyNotification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "AgencyLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyNotification" ADD CONSTRAINT "AgencyNotification_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "AgencyDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
