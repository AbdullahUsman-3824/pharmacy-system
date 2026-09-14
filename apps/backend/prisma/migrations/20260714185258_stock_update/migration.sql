/*
  Warnings:

  - You are about to drop the column `quantity` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `batchNumber` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `free` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `gross` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `loose` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `pack` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `StockVoucherItem` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `StockVoucherItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,batchNumber,expiryDate]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `saleRate` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Made the column `purchaseRate` on table `Batch` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `batchId` to the `StockVoucherItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grossAmount` to the `StockVoucherItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `netAmount` to the `StockVoucherItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseRate` to the `StockVoucherItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `StockVoucherItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saleRate` to the `StockVoucherItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockVoucherType" ADD VALUE 'PURCHASE_RETURN';
ALTER TYPE "StockVoucherType" ADD VALUE 'STOCK_ADJUSTMENT';
ALTER TYPE "StockVoucherType" ADD VALUE 'STOCK_TRANSFER';

-- DropIndex
DROP INDEX "Batch_productId_batchNumber_key";

-- DropIndex
DROP INDEX "StockVoucherItem_batchNumber_idx";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "quantity",
ADD COLUMN     "currentQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "manufacturingDate" TIMESTAMP(3),
ADD COLUMN     "openingQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "saleRate" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "purchaseRate" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockVoucher" ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StockVoucherItem" DROP COLUMN "amount",
DROP COLUMN "batchNumber",
DROP COLUMN "deletedAt",
DROP COLUMN "expiryDate",
DROP COLUMN "free",
DROP COLUMN "gross",
DROP COLUMN "loose",
DROP COLUMN "pack",
DROP COLUMN "rate",
DROP COLUMN "size",
ADD COLUMN     "batchId" TEXT NOT NULL,
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "freeQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "grossAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "netAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "purchaseRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "saleRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxPercent" DECIMAL(5,2);

-- CreateIndex
CREATE INDEX "Batch_productId_idx" ON "Batch"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_productId_batchNumber_expiryDate_key" ON "Batch"("productId", "batchNumber", "expiryDate");

-- CreateIndex
CREATE INDEX "StockVoucherItem_productId_idx" ON "StockVoucherItem"("productId");

-- CreateIndex
CREATE INDEX "StockVoucherItem_batchId_idx" ON "StockVoucherItem"("batchId");

-- AddForeignKey
ALTER TABLE "StockVoucherItem" ADD CONSTRAINT "StockVoucherItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
