/*
  Warnings:

  - A unique constraint covering the columns `[pin]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_pin_key" ON "User"("pin");
