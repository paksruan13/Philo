/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `Donation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productSaleId]` on the table `Donation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_teamId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSale" DROP CONSTRAINT "ProductSale_teamId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSale" DROP CONSTRAINT "ProductSale_userId_fkey";

-- DropIndex
DROP INDEX "Donation_stripeSessionId_key";

-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "stripeSessionId",
ADD COLUMN     "productSaleId" TEXT,
ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProductSale" ADD COLUMN     "externalCustomerEmail" TEXT,
ADD COLUMN     "externalCustomerName" TEXT,
ADD COLUMN     "isExternalSale" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Donation_productSaleId_key" ON "Donation"("productSaleId");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_productSaleId_fkey" FOREIGN KEY ("productSaleId") REFERENCES "ProductSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSale" ADD CONSTRAINT "ProductSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSale" ADD CONSTRAINT "ProductSale_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
