-- CreateTable
CREATE TABLE "SaleNumberCounter" (
    "id" TEXT NOT NULL,
    "type" "SaleType" NOT NULL,
    "dateKey" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SaleNumberCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleNumberCounter_type_dateKey_key" ON "SaleNumberCounter"("type", "dateKey");
