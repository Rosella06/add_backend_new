-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "usersId" VARCHAR(200);

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
