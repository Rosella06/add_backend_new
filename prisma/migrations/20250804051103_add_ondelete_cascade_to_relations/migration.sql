-- DropForeignKey
ALTER TABLE "public"."Orders" DROP CONSTRAINT "Orders_prescriptionId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Orders" ADD CONSTRAINT "Orders_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
