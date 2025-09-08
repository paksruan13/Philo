/*
  Warnings:

  - You are about to drop the `ShirtPrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ShirtPrice" DROP CONSTRAINT "ShirtPrice_updatedBy_fkey";

-- AlterTable
ALTER TABLE "ShirtConfig" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 15.00;

-- DropTable
DROP TABLE "ShirtPrice";
