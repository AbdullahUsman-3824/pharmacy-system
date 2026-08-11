/*
  Warnings:

  - You are about to drop the column `quantity` on the `LegacyPurchaseItem` table. All the data in the column will be lost.
  - Added the required column `looseQuantity` to the `LegacyPurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packQuantity` to the `LegacyPurchaseItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LegacyPurchaseItem" DROP COLUMN "quantity",
ADD COLUMN     "looseQuantity" DECIMAL(18,5) NOT NULL,
ADD COLUMN     "packQuantity" DECIMAL(18,5) NOT NULL;
