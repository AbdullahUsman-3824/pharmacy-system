/*
  Warnings:

  - You are about to drop the column `looseQuantity` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `looseRate` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `StockVoucherItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "looseQuantity";

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "looseRate";

-- AlterTable
ALTER TABLE "StockVoucherItem" DROP COLUMN "quantity",
ADD COLUMN     "looseQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "packQuantity" INTEGER NOT NULL DEFAULT 0;
