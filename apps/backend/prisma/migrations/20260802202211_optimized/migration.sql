-- DropIndex
DROP INDEX "Sale_date_idx";

-- CreateIndex
CREATE INDEX "Sale_deletedAt_idx" ON "Sale"("deletedAt");

-- CreateIndex
CREATE INDEX "Sale_date_idx" ON "Sale"("date" DESC);

-- CreateIndex
CREATE INDEX "Sale_customerName_idx" ON "Sale"("customerName");

-- CreateIndex
CREATE INDEX "Sale_originalSaleId_idx" ON "Sale"("originalSaleId");

-- CreateIndex
CREATE INDEX "Sale_date_type_idx" ON "Sale"("date", "type");

-- CreateIndex
CREATE INDEX "SaleItem_productId_batchId_idx" ON "SaleItem"("productId", "batchId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_productId_batchId_idx" ON "SaleItem"("saleId", "productId", "batchId");
