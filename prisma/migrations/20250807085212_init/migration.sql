/*
  Warnings:

  - You are about to drop the column `usersId` on the `Prescription` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_usersId_fkey";

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "usersId",
ADD COLUMN     "userId" VARCHAR(200);

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
