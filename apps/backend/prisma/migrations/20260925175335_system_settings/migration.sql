-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" UUID NOT NULL,
    "pharmacyName" TEXT,
    "pharmacyAddress" TEXT,
    "pharmacyPhone" TEXT,
    "pharmacyEmail" TEXT,
    "pharmacyLogo" TEXT,
    "gstEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gstRate" DECIMAL(5,2),
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
