-- CreateTable
CREATE TABLE "CodeSequence" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextValue" BIGINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeSequence_prefix_key" ON "CodeSequence"("prefix");
