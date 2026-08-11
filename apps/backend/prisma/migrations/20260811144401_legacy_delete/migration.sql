/*
  Warnings:

  - You are about to drop the `LegacyPurchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LegacyPurchaseItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LegacyPurchaseItem" DROP CONSTRAINT "LegacyPurchaseItem_purchaseId_fkey";

-- DropTable
DROP TABLE "LegacyPurchase";

-- DropTable
DROP TABLE "LegacyPurchaseItem";
