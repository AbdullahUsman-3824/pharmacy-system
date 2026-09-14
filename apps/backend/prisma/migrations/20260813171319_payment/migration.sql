/*
  Warnings:

  - The values [DISTRIBUTOR] on the enum `BusinessContactType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `customerName` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `distributorId` on the `StockVoucher` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BusinessContactType_new" AS ENUM ('CUSTOMER', 'SUPPLIER');
ALTER TABLE "BusinessContact" ALTER COLUMN "type" TYPE "BusinessContactType_new" USING ("type"::text::"BusinessContactType_new");
ALTER TYPE "BusinessContactType" RENAME TO "BusinessContactType_old";
ALTER TYPE "BusinessContactType_new" RENAME TO "BusinessContactType";
DROP TYPE "public"."BusinessContactType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "StockVoucher" DROP CONSTRAINT "StockVoucher_distributorId_fkey";

-- DropIndex
DROP INDEX "Sale_customerName_idx";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "customerName",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockVoucher" DROP COLUMN "distributorId",
ADD COLUMN     "supplierId" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentAccountId" TEXT NOT NULL,
    "saleId" TEXT,
    "stockVoucherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_paymentAccountId_idx" ON "Payment"("paymentAccountId");

-- CreateIndex
CREATE INDEX "Payment_saleId_idx" ON "Payment"("saleId");

-- CreateIndex
CREATE INDEX "Payment_stockVoucherId_idx" ON "Payment"("stockVoucherId");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "StockVoucher_supplierId_idx" ON "StockVoucher"("supplierId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_stockVoucherId_fkey" FOREIGN KEY ("stockVoucherId") REFERENCES "StockVoucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "BusinessContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockVoucher" ADD CONSTRAINT "StockVoucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BusinessContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
