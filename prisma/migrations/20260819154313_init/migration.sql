-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('BLUEPRINT_PENDING', 'IN_PROGRESS', 'GENERATING_QUESTION', 'AWAITING_ANSWER', 'COMPLETED', 'ABANDONED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssessmentMode" AS ENUM ('BALANCED', 'DEEP', 'PRACTICAL', 'CONCEPTUAL');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODE_OUTPUT', 'CODE_WRITING', 'DEBUGGING', 'CONCEPTUAL_EXPLANATION', 'SCENARIO', 'PRACTICAL_PROBLEM');

-- CreateEnum
CREATE TYPE "QuestionPurpose" AS ENUM ('BASELINE', 'SAME_CONCEPT_EASIER', 'SAME_CONCEPT_DIFFERENT_FORM', 'SAME_CONCEPT_HARDER', 'PREREQUISITE_TEST', 'REMEDIAL_TEST', 'TRANSFER_TEST', 'RELATED_CONCEPT', 'NEW_CONCEPT', 'ADVANCED_CONCEPT');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('CORRECT', 'INCORRECT', 'PARTIALLY_CORRECT', 'UNCERTAIN');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('NONE', 'CONCEPTUAL_GAP', 'SYNTAX_ERROR', 'LOGIC_ERROR', 'TYPE_ERROR', 'GUESS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SkillState" AS ENUM ('STRONG', 'DEVELOPING', 'WEAK', 'UNCERTAIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "mode" "AssessmentMode" NOT NULL DEFAULT 'BALANCED',
    "targetCount" INTEGER NOT NULL DEFAULT 20,
    "askedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'BLUEPRINT_PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastAiCallAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentBlueprint" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "conceptId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "purpose" "QuestionPurpose" NOT NULL DEFAULT 'BASELINE',
    "difficulty" DOUBLE PRECISION NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "rationale" TEXT,
    "reachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rawAnswer" TEXT NOT NULL,
    "confidence" INTEGER,
    "timeTakenMs" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIEvaluation" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL,
    "correctness" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "errorType" "ErrorType" NOT NULL DEFAULT 'NONE',
    "misconception" TEXT,
    "understood" JSONB NOT NULL,
    "missing" JSONB NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillObservation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "correctness" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEstimate" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "proficiency" DOUBLE PRECISION NOT NULL,
    "evidenceConfidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "state" "SkillState" NOT NULL DEFAULT 'UNCERTAIN',
    "difficultyCeiling" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transferVerified" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT,
    "conceptId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overallProficiency" DOUBLE PRECISION NOT NULL,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "strongAreas" JSONB NOT NULL,
    "developingAreas" JSONB NOT NULL,
    "weakAreas" JSONB NOT NULL,
    "uncertainAreas" JSONB NOT NULL,
    "misconceptions" JSONB NOT NULL,
    "difficultyCeiling" DOUBLE PRECISION NOT NULL,
    "transferPerformance" DOUBLE PRECISION NOT NULL,
    "improvementDuringAssessment" DOUBLE PRECISION NOT NULL,
    "recommendedNextAreas" JSONB NOT NULL,
    "remainingUncertainties" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "AssessmentSession_userId_idx" ON "AssessmentSession"("userId");

-- CreateIndex
CREATE INDEX "AssessmentSession_status_idx" ON "AssessmentSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentBlueprint_sessionId_key" ON "AssessmentBlueprint"("sessionId");

-- CreateIndex
CREATE INDEX "GeneratedQuestion_sessionId_sequence_idx" ON "GeneratedQuestion"("sessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedQuestion_sessionId_fingerprint_key" ON "GeneratedQuestion"("sessionId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_key" ON "Answer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AIEvaluation_questionId_key" ON "AIEvaluation"("questionId");

-- CreateIndex
CREATE INDEX "SkillObservation_sessionId_conceptId_idx" ON "SkillObservation"("sessionId", "conceptId");

-- CreateIndex
CREATE INDEX "SkillEstimate_sessionId_idx" ON "SkillEstimate"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillEstimate_sessionId_conceptId_key" ON "SkillEstimate"("sessionId", "conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "Intervention_questionId_key" ON "Intervention"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_sessionId_key" ON "AssessmentResult"("sessionId");

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentBlueprint" ADD CONSTRAINT "AssessmentBlueprint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedQuestion" ADD CONSTRAINT "GeneratedQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GeneratedQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEvaluation" ADD CONSTRAINT "AIEvaluation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GeneratedQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillObservation" ADD CONSTRAINT "SkillObservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEstimate" ADD CONSTRAINT "SkillEstimate_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GeneratedQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
