/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Orders_id_key" ON "public"."Orders"("id");
