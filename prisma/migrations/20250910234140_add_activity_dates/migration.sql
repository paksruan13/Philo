-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "groupMeLink" TEXT;
