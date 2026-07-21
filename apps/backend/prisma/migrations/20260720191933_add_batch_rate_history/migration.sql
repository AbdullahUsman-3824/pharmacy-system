-- CreateTable
CREATE TABLE "BatchRateHistory" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "oldPurchaseRate" DECIMAL(65,30) NOT NULL,
    "oldSaleRate" DECIMAL(65,30) NOT NULL,
    "newPurchaseRate" DECIMAL(65,30) NOT NULL,
    "newSaleRate" DECIMAL(65,30) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchRateHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BatchRateHistory" ADD CONSTRAINT "BatchRateHistory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
