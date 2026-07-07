/*
  Warnings:

  - The `packingSize` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "packingSize",
ADD COLUMN     "packingSize" DECIMAL(10,2);

-- DropTable
DROP TABLE "Test";
