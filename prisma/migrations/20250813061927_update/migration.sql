/*
  Warnings:

  - A unique constraint covering the columns `[machineId,floor,position]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Inventory_floor_position_key";

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_machineId_floor_position_key" ON "Inventory"("machineId", "floor", "position");
