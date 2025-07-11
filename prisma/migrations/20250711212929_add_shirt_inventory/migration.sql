/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Donation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamCode]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shirtSize` to the `ShirtSale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamCode` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'COACH', 'ADMIN');

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "ShirtSale" ADD COLUMN     "shirtSize" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "coachId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "teamCode" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT NOT NULL DEFAULT 'CHANGE_ME',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ShirtInventory" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShirtInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShirtInventory_size_key" ON "ShirtInventory"("size");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamCode_key" ON "Team"("teamCode");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
