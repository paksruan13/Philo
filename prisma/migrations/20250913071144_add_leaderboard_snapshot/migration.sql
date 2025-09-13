-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rankings" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_period_calculatedAt_idx" ON "LeaderboardSnapshot"("period", "calculatedAt");
