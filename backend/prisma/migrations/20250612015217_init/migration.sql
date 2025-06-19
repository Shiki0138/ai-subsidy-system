-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'GENERATING', 'GENERATED', 'EDITING', 'COMPLETED', 'SUBMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ApplicationResult" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "companyName" TEXT,
    "representativeName" TEXT,
    "businessType" TEXT,
    "foundedYear" INTEGER,
    "employeeCount" INTEGER,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidy_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "category" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "targetBusiness" TEXT,
    "maxAmount" INTEGER,
    "subsidyRate" DOUBLE PRECISION,
    "applicationStart" TIMESTAMP(3),
    "applicationEnd" TIMESTAMP(3),
    "requirements" JSONB,
    "documentFormat" JSONB,
    "evaluationCriteria" JSONB,
    "sourceUrl" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidy_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subsidyProgramId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "progress" INTEGER,
    "inputData" JSONB,
    "businessPlan" JSONB,
    "companyInfo" JSONB,
    "websiteData" JSONB,
    "generatedContent" JSONB,
    "aiModel" TEXT,
    "promptUsed" TEXT,
    "generationTime" INTEGER,
    "estimatedScore" DOUBLE PRECISION,
    "wordCount" INTEGER,
    "errorMessage" TEXT,
    "editedContent" JSONB,
    "revisionHistory" JSONB[],
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "result" "ApplicationResult" DEFAULT 'PENDING',
    "resultNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "subsidyProgramId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "userPromptTemplate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "maxTokens" INTEGER NOT NULL DEFAULT 4000,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "avgGenerationTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "applicationId" TEXT,
    "model" TEXT NOT NULL,
    "promptLength" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "responseTime" INTEGER NOT NULL,
    "status" "AiStatus" NOT NULL,
    "errorMessage" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageType" TEXT NOT NULL,
    "bucketName" TEXT,
    "objectKey" TEXT NOT NULL,
    "url" TEXT,
    "uploadedBy" TEXT,
    "purpose" TEXT,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "checksum" TEXT,
    "isScanned" BOOLEAN NOT NULL DEFAULT false,
    "scanResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "subsidy_programs_isActive_idx" ON "subsidy_programs"("isActive");

-- CreateIndex
CREATE INDEX "subsidy_programs_applicationStart_applicationEnd_idx" ON "subsidy_programs"("applicationStart", "applicationEnd");

-- CreateIndex
CREATE INDEX "applications_userId_idx" ON "applications"("userId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_createdAt_idx" ON "applications"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "file_uploads_uploadedBy_idx" ON "file_uploads"("uploadedBy");

-- CreateIndex
CREATE INDEX "file_uploads_isTemporary_expiresAt_idx" ON "file_uploads"("isTemporary", "expiresAt");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_subsidyProgramId_fkey" FOREIGN KEY ("subsidyProgramId") REFERENCES "subsidy_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_subsidyProgramId_fkey" FOREIGN KEY ("subsidyProgramId") REFERENCES "subsidy_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
