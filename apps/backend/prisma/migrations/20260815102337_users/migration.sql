/*
  Warnings:

  - You are about to drop the column `distributorId` on the `Batch` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('OWNER', 'STAFF');

-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_distributorId_fkey";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "distributorId";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "StockVoucher" ADD COLUMN     "createdById" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "type" "UserType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockVoucher" ADD CONSTRAINT "StockVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
