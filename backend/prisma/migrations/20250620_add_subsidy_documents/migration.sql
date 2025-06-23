-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('OVERVIEW', 'GUIDELINE', 'APPLICATION_FORM', 'CHECKLIST', 'FAQ', 'PRESENTATION', 'EXAMPLE', 'OTHER');

-- CreateTable
CREATE TABLE "subsidy_documents" (
    "id" TEXT NOT NULL,
    "subsidyProgramId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "version" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3) NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "changeLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subsidy_documents_subsidyProgramId_type_isLatest_idx" ON "subsidy_documents"("subsidyProgramId", "type", "isLatest");

-- CreateIndex
CREATE INDEX "subsidy_documents_publishedDate_idx" ON "subsidy_documents"("publishedDate");

-- AddForeignKey
ALTER TABLE "subsidy_documents" ADD CONSTRAINT "subsidy_documents_subsidyProgramId_fkey" FOREIGN KEY ("subsidyProgramId") REFERENCES "subsidy_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;