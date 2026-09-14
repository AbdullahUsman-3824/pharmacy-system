/*
  Warnings:

  - Made the column `packingSize` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_genericId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_groupId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "groupId" DROP NOT NULL,
ALTER COLUMN "genericId" DROP NOT NULL,
ALTER COLUMN "packingSize" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_genericId_fkey" FOREIGN KEY ("genericId") REFERENCES "Generic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
