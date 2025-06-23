-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('ACTIVE', 'DELETED', 'QUARANTINED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "GuidelineStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "UsageRightStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('PAYMENT', 'REFUND', 'SUBSCRIPTION', 'SUBSCRIPTION_REFUND');

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "sanitizedName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "backend" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "scanResult" JSONB NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'ACTIVE',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adopted_cases" (
    "id" TEXT NOT NULL,
    "subsidyProgram" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "projectTitle" TEXT NOT NULL,
    "projectDescription" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "companySize" TEXT NOT NULL,
    "investmentAmount" INTEGER NOT NULL DEFAULT 0,
    "subsidyAmount" INTEGER NOT NULL DEFAULT 0,
    "implementationPeriod" TEXT,
    "expectedResults" TEXT,
    "achievements" TEXT NOT NULL,
    "keySuccessFactors" TEXT NOT NULL,
    "lessonsLearned" TEXT NOT NULL,
    "applicableScenarios" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3) NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "extractionMethod" TEXT,
    "tags" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adopted_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidy_guidelines" (
    "id" TEXT NOT NULL,
    "subsidyProgramId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "targetBusinessSize" TEXT[],
    "targetIndustries" TEXT[],
    "eligibilityRequirements" JSONB NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "subsidyRate" DOUBLE PRECISION NOT NULL,
    "subsidyDetails" JSONB NOT NULL,
    "applicationStart" TIMESTAMP(3) NOT NULL,
    "applicationEnd" TIMESTAMP(3) NOT NULL,
    "evaluationCriteria" JSONB NOT NULL,
    "scoringWeights" JSONB NOT NULL,
    "requiredDocuments" JSONB NOT NULL,
    "documentTemplates" JSONB,
    "importantKeywords" TEXT[],
    "evaluationPhrases" TEXT[],
    "guidelinePdfUrl" TEXT,
    "faqUrl" TEXT,
    "exampleUrl" TEXT,
    "status" "GuidelineStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidy_guidelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsidy_requirements" (
    "id" TEXT NOT NULL,
    "guidelineId" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL,
    "checkMethod" TEXT,
    "relatedDocuments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subsidy_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_criteria" (
    "id" TEXT NOT NULL,
    "guidelineId" TEXT NOT NULL,
    "criterionName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "keywords" TEXT[],
    "evaluationPoints" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_cases" (
    "id" TEXT NOT NULL,
    "guidelineId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "projectTitle" TEXT NOT NULL,
    "applicationYear" INTEGER NOT NULL,
    "businessPlan" JSONB NOT NULL,
    "applicationContent" JSONB NOT NULL,
    "keyPhrases" TEXT[],
    "evaluationScore" DOUBLE PRECISION NOT NULL,
    "evaluationComments" JSONB,
    "wasAdopted" BOOLEAN NOT NULL,
    "successFactors" TEXT[],
    "strongPoints" TEXT[],
    "improvementAreas" TEXT[],
    "extractedPatterns" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "success_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subsidyProgramId" TEXT NOT NULL,
    "companyData" JSONB NOT NULL,
    "projectData" JSONB NOT NULL,
    "analysisResult" JSONB NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_scores" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "suggestions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pdfId" TEXT,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'jpy',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "customerId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_usage_rights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pdfId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "downloadLimit" INTEGER NOT NULL DEFAULT 3,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "status" "UsageRightStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "pdf_usage_rights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "usageLimit" INTEGER NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BillingType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "sessionId" TEXT,
    "subscriptionId" TEXT,
    "refundId" TEXT,
    "stripeInvoiceId" TEXT,
    "stripeChargeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uploaded_files_userId_idx" ON "uploaded_files"("userId");

-- CreateIndex
CREATE INDEX "uploaded_files_status_idx" ON "uploaded_files"("status");

-- CreateIndex
CREATE INDEX "uploaded_files_hash_idx" ON "uploaded_files"("hash");

-- CreateIndex
CREATE INDEX "uploaded_files_uploadedAt_idx" ON "uploaded_files"("uploadedAt");

-- CreateIndex
CREATE INDEX "adopted_cases_industry_idx" ON "adopted_cases"("industry");

-- CreateIndex
CREATE INDEX "adopted_cases_subsidyProgram_idx" ON "adopted_cases"("subsidyProgram");

-- CreateIndex
CREATE INDEX "adopted_cases_publishedDate_idx" ON "adopted_cases"("publishedDate");

-- CreateIndex
CREATE INDEX "adopted_cases_companySize_idx" ON "adopted_cases"("companySize");

-- CreateIndex
CREATE INDEX "adopted_cases_isVerified_isPublic_idx" ON "adopted_cases"("isVerified", "isPublic");

-- CreateIndex
CREATE INDEX "subsidy_guidelines_subsidyProgramId_idx" ON "subsidy_guidelines"("subsidyProgramId");

-- CreateIndex
CREATE INDEX "subsidy_guidelines_status_idx" ON "subsidy_guidelines"("status");

-- CreateIndex
CREATE INDEX "subsidy_guidelines_applicationStart_applicationEnd_idx" ON "subsidy_guidelines"("applicationStart", "applicationEnd");

-- CreateIndex
CREATE INDEX "subsidy_requirements_guidelineId_idx" ON "subsidy_requirements"("guidelineId");

-- CreateIndex
CREATE INDEX "evaluation_criteria_guidelineId_idx" ON "evaluation_criteria"("guidelineId");

-- CreateIndex
CREATE INDEX "success_cases_guidelineId_idx" ON "success_cases"("guidelineId");

-- CreateIndex
CREATE INDEX "success_cases_wasAdopted_idx" ON "success_cases"("wasAdopted");

-- CreateIndex
CREATE INDEX "success_cases_evaluationScore_idx" ON "success_cases"("evaluationScore");

-- CreateIndex
CREATE INDEX "application_analyses_userId_idx" ON "application_analyses"("userId");

-- CreateIndex
CREATE INDEX "application_analyses_subsidyProgramId_idx" ON "application_analyses"("subsidyProgramId");

-- CreateIndex
CREATE INDEX "application_scores_applicationId_idx" ON "application_scores"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_sessions_sessionId_key" ON "payment_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "payment_sessions_userId_idx" ON "payment_sessions"("userId");

-- CreateIndex
CREATE INDEX "payment_sessions_sessionId_idx" ON "payment_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "payment_sessions_status_idx" ON "payment_sessions"("status");

-- CreateIndex
CREATE INDEX "payment_sessions_createdAt_idx" ON "payment_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "pdf_usage_rights_userId_idx" ON "pdf_usage_rights"("userId");

-- CreateIndex
CREATE INDEX "pdf_usage_rights_pdfId_idx" ON "pdf_usage_rights"("pdfId");

-- CreateIndex
CREATE INDEX "pdf_usage_rights_sessionId_idx" ON "pdf_usage_rights"("sessionId");

-- CreateIndex
CREATE INDEX "pdf_usage_rights_validUntil_idx" ON "pdf_usage_rights"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_refundId_key" ON "refunds"("refundId");

-- CreateIndex
CREATE INDEX "refunds_userId_idx" ON "refunds"("userId");

-- CreateIndex
CREATE INDEX "refunds_sessionId_idx" ON "refunds"("sessionId");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE INDEX "refunds_createdAt_idx" ON "refunds"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripeSubscriptionId_key" ON "subscription_plans"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscription_plans_userId_idx" ON "subscription_plans"("userId");

-- CreateIndex
CREATE INDEX "subscription_plans_status_idx" ON "subscription_plans"("status");

-- CreateIndex
CREATE INDEX "subscription_plans_currentPeriodEnd_idx" ON "subscription_plans"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "billing_history_userId_idx" ON "billing_history"("userId");

-- CreateIndex
CREATE INDEX "billing_history_type_idx" ON "billing_history"("type");

-- CreateIndex
CREATE INDEX "billing_history_createdAt_idx" ON "billing_history"("createdAt");

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subsidy_guidelines" ADD CONSTRAINT "subsidy_guidelines_subsidyProgramId_fkey" FOREIGN KEY ("subsidyProgramId") REFERENCES "subsidy_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subsidy_requirements" ADD CONSTRAINT "subsidy_requirements_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "subsidy_guidelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "subsidy_guidelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_cases" ADD CONSTRAINT "success_cases_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "subsidy_guidelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_usage_rights" ADD CONSTRAINT "pdf_usage_rights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_usage_rights" ADD CONSTRAINT "pdf_usage_rights_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "payment_sessions"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "payment_sessions"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
