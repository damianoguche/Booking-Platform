/*
  Warnings:

  - You are about to drop the column `createdAt` on the `WebhookEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WebhookEvent" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
