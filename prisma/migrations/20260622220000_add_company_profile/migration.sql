-- AlterTable: company profile for the personalized read (PR B)
ALTER TABLE "Session"
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "sapVersion" TEXT,
  ADD COLUMN "companySize" TEXT,
  ADD COLUMN "dataSensitivity" TEXT,
  ADD COLUMN "profileToken" TEXT,
  ADD COLUMN "profileConfirmedAt" TIMESTAMP(3);

-- CreateIndex (NULLs are allowed and not considered duplicates in Postgres)
CREATE UNIQUE INDEX "Session_profileToken_key" ON "Session"("profileToken");
