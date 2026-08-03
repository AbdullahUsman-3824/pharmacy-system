-- CreateTable
CREATE TABLE "StockVoucherNumberCounter" (
    "id" TEXT NOT NULL,
    "type" "StockVoucherType" NOT NULL,
    "dateKey" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StockVoucherNumberCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockVoucherNumberCounter_type_dateKey_key" ON "StockVoucherNumberCounter"("type", "dateKey");
