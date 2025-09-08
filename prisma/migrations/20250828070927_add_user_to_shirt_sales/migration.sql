/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `ManualPointsAward` table. All the data in the column will be lost.
  - You are about to drop the `ActivityCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amountPaid` to the `ShirtSale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachId` to the `ShirtSale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `ShirtSale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ShirtSale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityCategoryType" AS ENUM ('PHOTO', 'PURCHASE', 'DONATION', 'OTHER');

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_categoryId_fkey";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "categoryId",
ADD COLUMN     "categoryType" "ActivityCategoryType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "ManualPointsAward" DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "ShirtSale" ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coachId" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ActivityCategory";

-- CreateTable
CREATE TABLE "ShirtInventory" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShirtInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShirtPrice" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 30.00,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "ShirtPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShirtInventory_size_key" ON "ShirtInventory"("size");

-- AddForeignKey
ALTER TABLE "ShirtSale" ADD CONSTRAINT "ShirtSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShirtSale" ADD CONSTRAINT "ShirtSale_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShirtPrice" ADD CONSTRAINT "ShirtPrice_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
