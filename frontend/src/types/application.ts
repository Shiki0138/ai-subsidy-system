/**
 * アプリケーション共通の型定義
 */

// 産業分類コード
export enum IndustryCode {
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  SERVICE = 'service',
  IT = 'it',
  HEALTHCARE = 'healthcare',
  CONSTRUCTION = 'construction',
  AGRICULTURE = 'agriculture',
  HOSPITALITY = 'hospitality',
  BEAUTY = 'beauty',
  EDUCATION = 'education',
  OTHER = 'other'
}

// 企業情報
export interface CompanyInput {
  name: string
  industry: IndustryCode
  employees: number
  founded?: number
  location_pref: string
  website_url?: string
  annualRevenue?: number
  capitalStock?: number
  businessDescription?: string
}

// プロジェクト情報
export interface ProjectInput {
  objective: string
  budget: number
  start_month?: string
  expected_effect?: string
  implementation_period?: number
  target_market?: string
  innovation_type?: string
}

// 統合入力
export interface ApplicationInput {
  company: CompanyInput
  project: ProjectInput
  createdAt?: Date
  userId?: string
  sessionId?: string
}

// マッチング結果
export interface SubsidyMatch {
  subsidyId: string
  name: string
  score: number
  remarks: string
  scoreBreakdown?: {
    eligibility: number
    objectiveMatch: number
    budgetFit: number
    industryPriority: number
  }
  recommendations?: string[]
  requiredDocuments?: string[]
}