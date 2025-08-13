-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'HEAD_PHARMACIST', 'PHARMACIST', 'ASSISTANT', 'SUPER');

-- CreateTable
CREATE TABLE "Drugs" (
    "id" TEXT NOT NULL,
    "drugCode" VARCHAR(20) NOT NULL,
    "drugName" VARCHAR(255) NOT NULL,
    "drugStatus" BOOLEAN NOT NULL DEFAULT true,
    "drugImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min" INTEGER NOT NULL DEFAULT 0,
    "max" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "drugId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(200),
    "prescriptionNo" VARCHAR(200) NOT NULL,
    "prescriptionDate" VARCHAR(200) NOT NULL,
    "hn" VARCHAR(20) NOT NULL,
    "an" VARCHAR(20),
    "patientName" VARCHAR(200) NOT NULL,
    "wardCode" VARCHAR(20) NOT NULL,
    "wardDesc" VARCHAR(200) NOT NULL,
    "priorityCode" VARCHAR(20) NOT NULL,
    "priorityDesc" VARCHAR(200) NOT NULL,
    "status" VARCHAR(100) NOT NULL DEFAULT 'ready',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "orderItemName" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCode" VARCHAR(20) NOT NULL,
    "command" VARCHAR(200),
    "status" VARCHAR(100) NOT NULL DEFAULT 'ready',
    "floor" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "slot" VARCHAR(3),
    "prescriptionId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machines" (
    "id" TEXT NOT NULL,
    "machineName" VARCHAR(200) NOT NULL,
    "status" CHAR(20) NOT NULL DEFAULT 'offline',
    "ipAddress" VARCHAR(100),
    "running" INTEGER NOT NULL DEFAULT 1,
    "runningCheck" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "userName" VARCHAR(155) NOT NULL,
    "userPassword" VARCHAR(155) NOT NULL,
    "pinCode" VARCHAR(155),
    "displayName" VARCHAR(150) NOT NULL,
    "userImage" TEXT,
    "userStatus" BOOLEAN NOT NULL DEFAULT true,
    "userRole" "Role" NOT NULL DEFAULT 'USER',
    "createBy" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemErrors" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "payload" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemErrors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Drugs_drugCode_key" ON "Drugs"("drugCode");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_floor_position_key" ON "Inventory"("floor", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNo_key" ON "Prescription"("prescriptionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Orders_id_key" ON "Orders"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Orders_prescriptionId_drugId_key" ON "Orders"("prescriptionId", "drugId");

-- CreateIndex
CREATE UNIQUE INDEX "Machines_ipAddress_key" ON "Machines"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Users_userName_key" ON "Users"("userName");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drugs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drugs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
