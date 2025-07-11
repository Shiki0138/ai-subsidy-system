import { api } from './base';

export interface SubsidyProgram {
  id: string;
  name: string;
  officialName?: string;
  category: string;
  organizationName: string;
  description?: string;
  purpose?: string;
  targetBusiness?: string;
  maxAmount?: number;
  subsidyRate?: number;
  applicationStart?: string;
  applicationEnd?: string;
  requirements?: any;
  documentFormat?: any;
  evaluationCriteria?: any;
  sourceUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubsidyProgramListParams {
  category?: string;
  isActive?: boolean;
  maxAmount?: number;
  search?: string;
  organizationName?: string;
}

export interface SubsidyProgramTemplate {
  subsidyName: string;
  category: string;
  maxAmount: number;
  deadline: string;
  sections: Array<{
    id: string;
    name: string;
    description: string;
    required: boolean;
    maxLength?: number;
    placeholder: string;
    guidelines: string[];
  }>;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  evaluationCriteria: string[];
}

class SubsidyProgramApi {
  /**
   * 補助金プログラム一覧取得
   */
  async getList(params: SubsidyProgramListParams = {}): Promise<{
    programs: SubsidyProgram[];
    totalCount: number;
    categories: Array<{
      name: string;
      count: number;
    }>;
  }> {
    const response = await api.get('/subsidy-programs', { params });
    return response.data;
  }

  /**
   * 補助金プログラム詳細取得
   */
  async getById(id: string): Promise<SubsidyProgram> {
    const response = await api.get(`/subsidy-programs/${id}`);
    return response.data;
  }

  /**
   * 補助金プログラムテンプレート取得
   */
  async getTemplate(id: string): Promise<SubsidyProgramTemplate> {
    const response = await api.get(`/subsidy-programs/${id}/template`);
    return response.data;
  }

  /**
   * 補助金プログラム検索
   */
  async search(query: string): Promise<{
    programs: SubsidyProgram[];
    suggestions: string[];
    totalCount: number;
  }> {
    const response = await api.get('/subsidy-programs/search', {
      params: { q: query }
    });
    return response.data;
  }

  /**
   * 申請期限が近い補助金プログラム
   */
  async getUpcomingDeadlines(days: number = 30): Promise<Array<{
    program: SubsidyProgram;
    daysRemaining: number;
    urgencyLevel: 'high' | 'medium' | 'low';
  }>> {
    const response = await api.get('/subsidy-programs/upcoming-deadlines', {
      params: { days }
    });
    return response.data;
  }

  /**
   * 人気の補助金プログラム
   */
  async getPopular(limit: number = 10): Promise<Array<{
    program: SubsidyProgram;
    applicationCount: number;
    successRate: number;
  }>> {
    const response = await api.get('/subsidy-programs/popular', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * 推奨補助金プログラム（ユーザープロフィールベース）
   */
  async getRecommended(): Promise<Array<{
    program: SubsidyProgram;
    matchScore: number;
    reasons: string[];
  }>> {
    const response = await api.get('/subsidy-programs/recommended');
    return response.data;
  }

  /**
   * 補助金プログラム統計
   */
  async getStats(): Promise<{
    totalPrograms: number;
    activePrograms: number;
    totalMaxAmount: number;
    averageMaxAmount: number;
    categoryDistribution: Record<string, number>;
    organizationDistribution: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      newPrograms: number;
      applications: number;
    }>;
  }> {
    const response = await api.get('/subsidy-programs/stats');
    return response.data;
  }

  /**
   * 補助金プログラム比較
   */
  async compare(programIds: string[]): Promise<{
    programs: SubsidyProgram[];
    comparison: {
      maxAmount: Record<string, number>;
      subsidyRate: Record<string, number>;
      requirements: Record<string, string[]>;
      deadlines: Record<string, string>;
      difficulty: Record<string, 'easy' | 'medium' | 'hard'>;
    };
    recommendations: Array<{
      programId: string;
      reason: string;
      score: number;
    }>;
  }> {
    const response = await api.post('/subsidy-programs/compare', {
      programIds
    });
    return response.data;
  }

  /**
   * 補助金プログラム申請履歴
   */
  async getApplicationHistory(programId: string): Promise<Array<{
    applicationId: string;
    applicantName: string;
    status: string;
    score?: number;
    submittedAt: string;
    result?: 'approved' | 'rejected' | 'pending';
  }>> {
    const response = await api.get(`/subsidy-programs/${programId}/applications`);
    return response.data;
  }

  /**
   * 補助金プログラムの成功事例
   */
  async getSuccessStories(programId: string): Promise<Array<{
    id: string;
    title: string;
    companyName: string;
    industry: string;
    amount: number;
    description: string;
    results: string;
    publishedAt: string;
  }>> {
    const response = await api.get(`/subsidy-programs/${programId}/success-stories`);
    return response.data;
  }

  /**
   * 補助金プログラムのFAQ
   */
  async getFAQ(programId: string): Promise<Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    popularity: number;
    updatedAt: string;
  }>> {
    const response = await api.get(`/subsidy-programs/${programId}/faq`);
    return response.data;
  }

  /**
   * 補助金プログラムの関連リンク
   */
  async getRelatedLinks(programId: string): Promise<Array<{
    title: string;
    url: string;
    description: string;
    type: 'official' | 'guide' | 'example' | 'news';
  }>> {
    const response = await api.get(`/subsidy-programs/${programId}/links`);
    return response.data;
  }
}

export const subsidyProgramApi = new SubsidyProgramApi();