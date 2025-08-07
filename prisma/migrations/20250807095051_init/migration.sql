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
