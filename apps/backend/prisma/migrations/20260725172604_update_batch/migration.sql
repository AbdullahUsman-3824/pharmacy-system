/*
  Warnings:

  - You are about to drop the column `discountAmount` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxPercent` on the `SaleItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SellUnit" AS ENUM ('PACK', 'UNIT');

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "looseQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "taxPercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "discountAmount",
DROP COLUMN "discountPercent",
DROP COLUMN "taxAmount",
DROP COLUMN "taxPercent",
ADD COLUMN     "sellUnit" "SellUnit" NOT NULL DEFAULT 'PACK';

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
