/*
  Warnings:

  - You are about to drop the column `drugId` on the `Orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[prescriptionNo,drugCode]` on the table `Orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `drugCode` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Orders" DROP CONSTRAINT "Orders_drugId_fkey";

-- DropIndex
DROP INDEX "Orders_prescriptionNo_drugId_key";

-- AlterTable
ALTER TABLE "Orders" DROP COLUMN "drugId",
ADD COLUMN     "drugCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Orders_prescriptionNo_drugCode_key" ON "Orders"("prescriptionNo", "drugCode");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_drugCode_fkey" FOREIGN KEY ("drugCode") REFERENCES "Drugs"("drugCode") ON DELETE RESTRICT ON UPDATE CASCADE;
