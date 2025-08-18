/*
  Warnings:

  - You are about to drop the column `prescriptionId` on the `Orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[prescriptionNo,drugId]` on the table `Orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prescriptionNo` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Orders" DROP CONSTRAINT "Orders_prescriptionId_fkey";

-- DropIndex
DROP INDEX "Orders_prescriptionId_drugId_key";

-- AlterTable
ALTER TABLE "Orders" DROP COLUMN "prescriptionId",
ADD COLUMN     "prescriptionNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Orders_prescriptionNo_drugId_key" ON "Orders"("prescriptionNo", "drugId");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_prescriptionNo_fkey" FOREIGN KEY ("prescriptionNo") REFERENCES "Prescription"("prescriptionNo") ON DELETE CASCADE ON UPDATE CASCADE;
