import { api } from './base';
import type { 
  ApplicationFormData, 
  PartialApplicationFormData,
  ApplicationStepId 
} from '../../schemas/applicationSchema';

export interface ApplicationListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApplicationListResponse {
  applications: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    subsidyProgramName: string;
    createdAt: string;
    updatedAt: string;
    estimatedScore?: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApplicationDetail {
  id: string;
  title: string;
  status: string;
  progress: number;
  subsidyProgramId: string;
  subsidyProgram: {
    id: string;
    name: string;
    category: string;
    maxAmount: number;
    subsidyRate: number;
  };
  companyInfo: any;
  projectPlan: any;
  budgetPlan: any;
  documents: any;
  review: any;
  generatedContent: any;
  aiModel?: string;
  estimatedScore?: number;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
  lastSavedAt?: string;
}

export interface CreateApplicationData {
  subsidyProgramId: string;
  applicationTitle: string;
  companyInfo?: any;
}

export interface ProcessStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
}

class ApplicationApi {
  /**
   * 申請書一覧取得
   */
  async getList(params: ApplicationListParams = {}): Promise<ApplicationListResponse> {
    const response = await api.get('/applications', { params });
    return response.data;
  }

  /**
   * 申請書詳細取得
   */
  async getById(id: string): Promise<ApplicationDetail> {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  }

  /**
   * 申請書作成
   */
  async create(data: CreateApplicationData): Promise<ApplicationDetail> {
    const response = await api.post('/applications', data);
    return response.data;
  }

  /**
   * 申請書ステップ更新
   */
  async updateStep(
    applicationId: string, 
    stepId: ApplicationStepId, 
    data: any
  ): Promise<ApplicationDetail> {
    const response = await api.put(`/applications/${applicationId}/steps/${stepId}`, data);
    return response.data;
  }

  /**
   * 申請書自動保存
   */
  async autoSave(
    applicationId: string, 
    data: PartialApplicationFormData
  ): Promise<{ success: boolean; lastSavedAt: string }> {
    const response = await api.patch(`/applications/${applicationId}/auto-save`, data);
    return response.data;
  }

  /**
   * AI生成
   */
  async generateSection(
    applicationId: string,
    sectionType: string,
    additionalContext?: any
  ): Promise<{ generatedContent: any; processId?: string }> {
    const response = await api.post(`/applications/${applicationId}/generate`, {
      sectionType,
      additionalContext
    });
    return response.data;
  }

  /**
   * PDF生成
   */
  async generatePDF(applicationId: string): Promise<{ pdfUrl: string; downloadUrl: string }> {
    const response = await api.post(`/applications/${applicationId}/pdf`, {}, {
      timeout: 30000 // PDF生成は時間がかかる場合がある
    });
    return response.data;
  }

  /**
   * 申請書提出
   */
  async submit(applicationId: string, finalReview: any): Promise<ApplicationDetail> {
    const response = await api.post(`/applications/${applicationId}/submit`, finalReview);
    return response.data;
  }

  /**
   * 申請書削除
   */
  async delete(applicationId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/applications/${applicationId}`);
    return response.data;
  }

  /**
   * 申請書複製
   */
  async duplicate(applicationId: string, newTitle?: string): Promise<ApplicationDetail> {
    const response = await api.post(`/applications/${applicationId}/duplicate`, {
      title: newTitle
    });
    return response.data;
  }

  /**
   * ファイルアップロード
   */
  async uploadFile(formData: FormData): Promise<{ fileId: string; fileName: string; url: string }> {
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000 // ファイルアップロードは時間がかかる
    });
    return response.data;
  }

  /**
   * 申請書履歴取得
   */
  async getHistory(applicationId: string): Promise<Array<{
    id: string;
    version: number;
    changes: string[];
    createdAt: string;
    createdBy: string;
  }>> {
    const response = await api.get(`/applications/${applicationId}/history`);
    return response.data;
  }

  /**
   * 進捗状況取得
   */
  async getProgress(applicationId: string): Promise<{
    status: string;
    progress: number;
    currentStep: string;
    completedSteps: string[];
    estimatedTimeRemaining?: number;
  }> {
    const response = await api.get(`/applications/${applicationId}/progress`);
    return response.data;
  }

  /**
   * AI分析結果取得
   */
  async getAnalysis(applicationId: string): Promise<{
    overallScore: number;
    sectionScores: Record<string, number>;
    improvements: Array<{
      section: string;
      issue: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    strengths: string[];
    weaknesses: string[];
  }> {
    const response = await api.get(`/applications/${applicationId}/analysis`);
    return response.data;
  }

  /**
   * 推定スコア取得
   */
  async getEstimatedScore(applicationId: string): Promise<{
    score: number;
    breakdown: Record<string, number>;
    confidence: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  }> {
    const response = await api.get(`/applications/${applicationId}/score`);
    return response.data;
  }

  /**
   * チェックリスト取得
   */
  async getChecklist(applicationId: string): Promise<{
    items: Array<{
      id: string;
      category: string;
      description: string;
      completed: boolean;
      required: boolean;
      helpText?: string;
    }>;
    completionRate: number;
    requiredItemsCompleted: number;
    totalRequiredItems: number;
  }> {
    const response = await api.get(`/applications/${applicationId}/checklist`);
    return response.data;
  }

  /**
   * ダッシュボード統計取得
   */
  async getDashboardStats(): Promise<{
    totalApplications: number;
    draftApplications: number;
    submittedApplications: number;
    approvedApplications: number;
    averageScore: number;
    recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      createdAt: string;
    }>;
  }> {
    const response = await api.get('/applications/stats/dashboard');
    return response.data;
  }

  /**
   * プロセス状況チェック
   */
  async checkProcessStatus(processId: string): Promise<ProcessStatus> {
    const response = await api.get(`/processes/${processId}/status`);
    return response.data;
  }

  /**
   * 一括削除
   */
  async batchDelete(applicationIds: string[]): Promise<{
    deletedCount: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const response = await api.post('/applications/batch/delete', {
      applicationIds
    });
    return response.data;
  }

  /**
   * エクスポート
   */
  async exportApplications(
    applicationIds: string[], 
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<{
    downloadUrl: string;
    fileName: string;
    expiresAt: string;
  }> {
    const response = await api.post('/applications/export', {
      applicationIds,
      format
    });
    return response.data;
  }

  /**
   * コメント取得
   */
  async getComments(applicationId: string): Promise<Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      role: string;
    };
    section?: string;
    isResolved: boolean;
    createdAt: string;
    replies: Array<{
      id: string;
      content: string;
      author: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>;
  }>> {
    const response = await api.get(`/applications/${applicationId}/comments`);
    return response.data;
  }

  /**
   * AI生成履歴取得
   */
  async getAIHistory(applicationId: string): Promise<Array<{
    id: string;
    sectionType: string;
    promptUsed: string;
    generatedContent: string;
    model: string;
    tokensUsed: number;
    generationTime: number;
    quality: number;
    createdAt: string;
  }>> {
    const response = await api.get(`/applications/${applicationId}/ai-history`);
    return response.data;
  }

  /**
   * テンプレート一覧取得
   */
  async getTemplates(params: {
    category?: string;
    isPublic?: boolean;
  } = {}): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    isPublic: boolean;
    usageCount: number;
    rating: number;
    author: {
      id: string;
      name: string;
    };
    createdAt: string;
  }>> {
    const response = await api.get('/applications/templates', { params });
    return response.data;
  }

  /**
   * 最近の活動取得
   */
  async getRecentActivity(limit: number = 10): Promise<Array<{
    id: string;
    type: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected';
    applicationId: string;
    applicationTitle: string;
    description: string;
    createdAt: string;
  }>> {
    const response = await api.get('/applications/activity/recent', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * 共有設定取得
   */
  async getSharingSettings(applicationId: string): Promise<{
    isShared: boolean;
    shareLevel: 'view' | 'edit' | 'comment';
    sharedWith: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      permission: 'view' | 'edit' | 'comment';
      sharedAt: string;
    }>;
    shareLink?: string;
    shareLinkExpires?: string;
  }> {
    const response = await api.get(`/applications/${applicationId}/sharing`);
    return response.data;
  }

  /**
   * 通知取得
   */
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      data?: any;
      createdAt: string;
    }>;
    unreadCount: number;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
    };
  }> {
    const response = await api.get('/notifications', { params });
    return response.data;
  }
}

export const applicationApi = new ApplicationApi();