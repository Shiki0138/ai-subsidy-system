/**
 * 申請書関連APIサービス
 */

import { api as apiClient } from './base'
import { AxiosResponse } from 'axios'

// 型定義
export interface CompanyProfile {
  id: string
  companyName: string
  industry: string
  businessDescription: string
  employeeCount: number
  annualRevenue?: number
  establishedYear?: number
  strengths: string[]
  challenges: string[]
  objectives: string[]
}

export interface ProjectPlan {
  title: string
  purpose: string
  background: string
  implementation: string
  expectedResults: string[]
  budget: number
  timeline: string
}

export interface AnalysisResult {
  matchScore: number
  eligibility: {
    isEligible: boolean
    reasons: string[]
    missingRequirements: string[]
  }
  recommendations: {
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
  }
  keywordAnalysis: {
    matchedKeywords: string[]
    suggestedKeywords: string[]
    keywordDensity: Record<string, number>
  }
  generatedContent: {
    optimizedTitle: string
    optimizedPurpose: string
    optimizedBackground: string
    keyPhrases: string[]
  }
}

export interface ApplicationDocument {
  title: string
  sections: {
    summary?: string
    background?: string
    implementation?: string
    expectedEffects?: string
    organizationStructure?: string
    schedule?: string
    budget?: any
    attachments?: string[]
  }
  metadata: {
    generatedAt: Date
    version: string
    subsidyProgram: any
    matchScore?: number
  }
}

export interface SubsidyProgram {
  id: string
  name: string
  category: string
  description: string
  maxAmount: number
  subsidyRate: number
  deadline: string
  requirements: string[]
}

export interface ApplicationFormData {
  subsidyProgramId: string
  subsidyProgram: SubsidyProgram
  companyProfile: CompanyProfile
  projectPlan: ProjectPlan
  budgetItems: Array<{
    category: string
    description: string
    amount: number
    isSubsidyTarget: boolean
  }>
  analysisResult?: AnalysisResult
  optimizedTitle?: string
  optimizedPurpose?: string
  optimizedBackground?: string
  implementation?: string
  expectedResults?: string[]
}

// APIサービス
export const applicationsApi = {
  /**
   * 補助金との適合性分析
   */
  analyzeMatch: async (data: {
    subsidyProgramId: string
    companyProfile: CompanyProfile
    projectPlan: ProjectPlan
  }): Promise<AnalysisResult> => {
    const response: AxiosResponse<{ success: boolean } & AnalysisResult> = 
      await apiClient.post('/applications/analyze', data)
    return response.data
  },

  /**
   * 申請書生成
   */
  generateApplication: async (data: ApplicationFormData): Promise<ApplicationDocument> => {
    const response: AxiosResponse<{ success: boolean; document: ApplicationDocument }> = 
      await apiClient.post('/applications/generate', data)
    return response.data.document
  },

  /**
   * セクション最適化
   */
  optimizeSection: async (data: {
    sectionType: string
    content: string
    subsidyProgramId: string
    keywords?: string[]
  }): Promise<{ optimizedContent: string; suggestions: string[] }> => {
    const response = await apiClient.post('/applications/optimize-section', data)
    return response.data
  },

  /**
   * テンプレート取得
   */
  getTemplate: async (subsidyProgramId: string): Promise<any> => {
    const response = await apiClient.get(`/applications/templates/${subsidyProgramId}`)
    return response.data.template
  },

  /**
   * 申請書スコアリング
   */
  scoreApplication: async (data: {
    applicationId: string
    content: any
  }): Promise<{
    totalScore: number
    breakdown: any
    suggestions: string[]
    estimatedSuccessRate: number
  }> => {
    const response = await apiClient.post('/applications/score', data)
    return response.data.scoring
  },

  /**
   * 申請書一覧取得
   */
  getApplications: async (): Promise<any[]> => {
    const response = await apiClient.get('/applications')
    return response.data.applications
  },

  /**
   * 申請書詳細取得
   */
  getApplication: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/applications/${id}`)
    return response.data.application
  },

  /**
   * 申請書保存
   */
  saveApplication: async (data: {
    subsidyProgramId: string
    title: string
    content: any
    status: string
  }): Promise<{ id: string }> => {
    const response = await apiClient.post('/applications', data)
    return response.data
  },

  /**
   * 申請書更新
   */
  updateApplication: async (id: string, data: any): Promise<void> => {
    await apiClient.put(`/applications/${id}`, data)
  },

  /**
   * PDF生成
   */
  generatePDF: async (applicationId: string): Promise<{ url: string }> => {
    const response = await apiClient.post(`/applications/${applicationId}/pdf`)
    return response.data
  }
}