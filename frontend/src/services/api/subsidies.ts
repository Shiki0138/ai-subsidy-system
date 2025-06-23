/**
 * 補助金情報APIサービス
 */

import { api as apiClient } from './base'

export interface SubsidyProgram {
  id: string
  name: string
  officialName?: string
  category: string
  organizationName: string
  description?: string
  purpose?: string
  targetBusiness?: string
  maxAmount?: number
  subsidyRate?: number
  applicationStart?: Date
  applicationEnd?: Date
  isActive: boolean
  guideline?: SubsidyGuideline
  documents?: SubsidyDocument[]
}

export interface SubsidyGuideline {
  id: string
  version: string
  title: string
  purpose: string
  overview: string
  targetBusinessSize: string[]
  targetIndustries: string[]
  eligibilityRequirements: {
    mandatory?: string[]
    optional?: string[]
  }
  minAmount: number
  maxAmount: number
  subsidyRate: number
  subsidyDetails: any
  requiredDocuments: {
    mandatory?: string[]
    conditional?: string[]
  }
  importantKeywords: string[]
  evaluationPhrases: string[]
  guidelinePdfUrl?: string
  faqUrl?: string
}

export interface SubsidyDocument {
  id: string
  type: string
  title: string
  description?: string
  fileUrl?: string
  fileSize?: number
  version: string
  publishedDate: Date
  isLatest: boolean
}

export const subsidiesApi = {
  /**
   * 補助金一覧取得
   */
  getSubsidies: async (): Promise<SubsidyProgram[]> => {
    const response = await apiClient.get('/subsidies')
    return response.data.subsidies
  },

  /**
   * 補助金詳細取得
   */
  getSubsidyDetail: async (subsidyId: string): Promise<SubsidyProgram> => {
    const response = await apiClient.get(`/subsidies/${subsidyId}`)
    return response.data
  },

  /**
   * 補助金書類一覧取得
   */
  getSubsidyDocuments: async (subsidyId: string): Promise<SubsidyDocument[]> => {
    const response = await apiClient.get(`/subsidies/${subsidyId}/documents`)
    return response.data.documents
  },

  /**
   * 書類テンプレートダウンロード
   */
  downloadTemplate: async (subsidyId: string, documentType: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/subsidies/${subsidyId}/templates/${documentType}`,
      { responseType: 'blob' }
    )
    return response.data
  },

  /**
   * 申請書自動入力用データ生成
   */
  generateFormData: async (
    subsidyId: string,
    applicationData: any
  ): Promise<any> => {
    const response = await apiClient.post(
      `/subsidies/${subsidyId}/generate-form-data`,
      applicationData
    )
    return response.data
  }
}