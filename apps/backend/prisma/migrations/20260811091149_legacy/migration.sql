-- CreateTable
CREATE TABLE "LegacyPurchase" (
    "id" TEXT NOT NULL,
    "oldMainKey" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyPurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "oldSerial" INTEGER NOT NULL,
    "oldProductKey" TEXT NOT NULL,
    "oldBatchNumber" TEXT,
    "oldExpiryDate" TIMESTAMP(3),
    "quantity" DECIMAL(18,5) NOT NULL,
    "freeQuantity" DECIMAL(18,5) NOT NULL,
    "purchaseRate" DECIMAL(18,5) NOT NULL,
    "grossAmount" DECIMAL(18,5) NOT NULL,
    "discountAmount" DECIMAL(18,5) NOT NULL,
    "taxAmount" DECIMAL(18,5) NOT NULL,
    "netAmount" DECIMAL(18,5) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyPurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegacyPurchase_oldMainKey_key" ON "LegacyPurchase"("oldMainKey");

-- CreateIndex
CREATE INDEX "LegacyPurchase_date_idx" ON "LegacyPurchase"("date");

-- CreateIndex
CREATE INDEX "LegacyPurchaseItem_oldProductKey_idx" ON "LegacyPurchaseItem"("oldProductKey");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyPurchaseItem_purchaseId_oldSerial_key" ON "LegacyPurchaseItem"("purchaseId", "oldSerial");

-- AddForeignKey
ALTER TABLE "LegacyPurchaseItem" ADD CONSTRAINT "LegacyPurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "LegacyPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
