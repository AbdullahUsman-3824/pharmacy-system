/*
  Warnings:

  - You are about to drop the column `quantity` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `sellUnit` on the `SaleItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "quantity",
DROP COLUMN "sellUnit",
ADD COLUMN     "looseQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "looseRate" DECIMAL(10,2),
ADD COLUMN     "packQuantity" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "SellUnit";
