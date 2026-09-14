-- CreateEnum
CREATE TYPE "BusinessContactType" AS ENUM ('CUSTOMER', 'DISTRIBUTOR');

-- CreateEnum
CREATE TYPE "PaymentAccountType" AS ENUM ('CASH', 'BANK');

-- CreateTable
CREATE TABLE "BusinessContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BusinessContactType" NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentAccountType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessContact_type_idx" ON "BusinessContact"("type");

-- CreateIndex
CREATE INDEX "BusinessContact_name_idx" ON "BusinessContact"("name");

-- CreateIndex
CREATE INDEX "PaymentAccount_type_idx" ON "PaymentAccount"("type");

-- CreateIndex
CREATE INDEX "PaymentAccount_name_idx" ON "PaymentAccount"("name");
