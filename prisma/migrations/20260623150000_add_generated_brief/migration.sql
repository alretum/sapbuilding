-- CreateTable
CREATE TABLE "GeneratedBrief" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "source" TEXT NOT NULL DEFAULT 'baseline',
    "doc" JSONB NOT NULL,
    "model" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedBrief_sessionId_key" ON "GeneratedBrief"("sessionId");

-- AddForeignKey
ALTER TABLE "GeneratedBrief" ADD CONSTRAINT "GeneratedBrief_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
