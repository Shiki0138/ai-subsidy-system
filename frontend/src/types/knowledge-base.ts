// 補助金知識ベースの型定義

export interface KnowledgeDocument {
  id: string
  type: 'guideline' | 'application' | 'example' | 'website' | 'other'
  name: string
  content: string
  url?: string
  uploadedAt: Date
  metadata?: {
    year?: string
    category?: string
    successRate?: string
    [key: string]: any
  }
}

export interface SubsidyKnowledgeBase {
  subsidyId: string
  subsidyName: string
  documents: KnowledgeDocument[]
  analysis?: {
    requirements: string[]
    evaluationCriteria: string[]
    successFactors: string[]
    commonMistakes: string[]
    keywords: string[]
    budget: {
      min: number
      max: number
      average: number
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface DocumentUploadRequest {
  type: KnowledgeDocument['type']
  file?: File
  url?: string
  name: string
}

export interface AnalysisResult {
  summary: string
  keyRequirements: string[]
  evaluationPoints: string[]
  successPatterns: string[]
  recommendedApproach: string
  riskFactors: string[]
}