/*
  Warnings:

  - You are about to drop the column `supplierId` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `defaultSupplierId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `StockVoucher` table. All the data in the column will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_defaultSupplierId_fkey";

-- DropForeignKey
ALTER TABLE "StockVoucher" DROP CONSTRAINT "StockVoucher_supplierId_fkey";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "supplierId",
ADD COLUMN     "distributorId" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "defaultSupplierId",
ADD COLUMN     "distributorId" TEXT;

-- AlterTable
ALTER TABLE "StockVoucher" DROP COLUMN "supplierId",
ADD COLUMN     "distributorId" TEXT;

-- DropTable
DROP TABLE "Supplier";

-- CreateTable
CREATE TABLE "Distributor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "openingBalance" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Distributor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Distributor_name_idx" ON "Distributor"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockVoucher" ADD CONSTRAINT "StockVoucher_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
