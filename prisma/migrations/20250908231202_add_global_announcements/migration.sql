-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_teamId_fkey";

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "isGlobal" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "teamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
