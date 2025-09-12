-- CreateTable
CREATE TABLE "ShirtConfig" (
    "id" TEXT NOT NULL,
    "pointsPerShirt" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "ShirtConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShirtConfig" ADD CONSTRAINT "ShirtConfig_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
