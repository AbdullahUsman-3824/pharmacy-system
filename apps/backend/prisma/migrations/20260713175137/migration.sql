/*
  Warnings:

  - You are about to drop the column `code` on the `Supplier` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Supplier_code_key";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "code";
