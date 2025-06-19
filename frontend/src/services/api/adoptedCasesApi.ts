import { api } from './base';

export interface AdoptedCase {
  id: string;
  subsidyProgram: string;
  companyName: string;
  projectTitle: string;
  projectDescription: string;
  industry: string;
  companySize: string;
  investmentAmount: number;
  subsidyAmount: number;
  implementationPeriod: string;
  expectedResults: string;
  achievements: string[];
  keySuccessFactors: string[];
  lessonsLearned: string[];
  applicableScenarios: string[];
  sourceUrl: string;
  publishedDate: string;
  similarityScore?: number;
  matchingFactors?: string[];
  applicabilityReason?: string;
}

export interface SimilarCasesParams {
  industry?: string;
  companySize?: string;
  subsidyType?: string;
  limit?: number;
}

export interface CasesListParams {
  page?: number;
  limit?: number;
  industry?: string;
  subsidyProgram?: string;
  companySize?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'publishedDate' | 'subsidyAmount' | 'similarity';
  sortOrder?: 'asc' | 'desc';
}

export interface ImportResult {
  totalCases: number;
  newCases: number;
  updatedCases: number;
  failedCases: number;
  errors: string[];
}

class AdoptedCasesApi {
  /**
   * 類似事例検索
   */
  async getSimilarCases(params: SimilarCasesParams): Promise<{
    profile: {
      companyName: string;
      industry: string;
      employeeCount: string;
    };
    similarCases: AdoptedCase[];
    searchCriteria: {
      industry?: string;
      companySize?: string;
      subsidyType?: string;
    };
  }> {
    const response = await api.get('/adopted-cases/similar', { params });
    return response.data;
  }

  /**
   * 特定事例の詳細取得
   */
  async getById(caseId: string): Promise<{
    case: AdoptedCase;
  }> {
    const response = await api.get(`/adopted-cases/${caseId}`);
    return response.data;
  }

  /**
   * 採択事例一覧取得（ページネーション付き）
   */
  async getList(params: CasesListParams = {}): Promise<{
    cases: AdoptedCase[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      industry?: string;
      subsidyProgram?: string;
    };
  }> {
    const response = await api.get('/adopted-cases', { params });
    return response.data;
  }

  /**
   * 事例の統計情報取得
   */
  async getStats(): Promise<{
    stats: {
      overview: {
        totalCases: number;
        avgInvestmentAmount: number;
        avgSubsidyAmount: number;
        avgSubsidyRate: number;
      };
      industryDistribution: Array<{
        industry: string;
        count: number;
        percentage: number;
      }>;
      subsidyProgramDistribution: Array<{
        program: string;
        count: number;
        percentage: number;
      }>;
    };
  }> {
    const response = await api.get('/adopted-cases/stats/overview');
    return response.data;
  }

  /**
   * 採択事例一括インポート（管理者のみ）
   */
  async importCases(targetSites?: string[]): Promise<{
    summary: {
      totalCases: number;
      newCases: number;
      updatedCases: number;
      failedCases: number;
    };
    errors: string[];
    importedCases: AdoptedCase[];
  }> {
    const response = await api.post('/adopted-cases/import', {
      targetSites
    });
    return response.data;
  }

  /**
   * 業界別成功要因分析
   */
  async getSuccessFactorsByIndustry(industry: string): Promise<{
    industry: string;
    totalCases: number;
    successFactors: Array<{
      factor: string;
      frequency: number;
      impact: number;
      examples: Array<{
        caseId: string;
        companyName: string;
        description: string;
      }>;
    }>;
    commonPatterns: Array<{
      pattern: string;
      description: string;
      frequency: number;
    }>;
  }> {
    const response = await api.get(`/adopted-cases/analysis/success-factors`, {
      params: { industry }
    });
    return response.data;
  }

  /**
   * 投資規模別分析
   */
  async getAnalysisByInvestmentSize(
    minAmount: number,
    maxAmount: number
  ): Promise<{
    range: {
      min: number;
      max: number;
    };
    totalCases: number;
    avgSubsidyRate: number;
    successRate: number;
    commonFeatures: Array<{
      feature: string;
      frequency: number;
      description: string;
    }>;
    riskFactors: Array<{
      factor: string;
      frequency: number;
      mitigation: string;
    }>;
  }> {
    const response = await api.get('/adopted-cases/analysis/investment-size', {
      params: { minAmount, maxAmount }
    });
    return response.data;
  }

  /**
   * 補助金プログラム別成功パターン
   */
  async getSuccessPatternsByProgram(subsidyProgram: string): Promise<{
    program: string;
    totalCases: number;
    avgSuccessRate: number;
    successPatterns: Array<{
      pattern: string;
      description: string;
      frequency: number;
      keyPoints: string[];
    }>;
    recommendedApproach: Array<{
      phase: string;
      action: string;
      importance: 'high' | 'medium' | 'low';
      timeline: string;
    }>;
  }> {
    const response = await api.get('/adopted-cases/analysis/success-patterns', {
      params: { subsidyProgram }
    });
    return response.data;
  }

  /**
   * 事例比較分析
   */
  async compareCases(caseIds: string[]): Promise<{
    cases: AdoptedCase[];
    comparison: {
      commonFactors: string[];
      differences: Array<{
        aspect: string;
        values: Record<string, any>;
      }>;
      recommendations: Array<{
        caseId: string;
        reason: string;
        applicability: number;
      }>;
    };
  }> {
    const response = await api.post('/adopted-cases/compare', {
      caseIds
    });
    return response.data;
  }

  /**
   * トレンド分析
   */
  async getTrends(period: '6months' | '1year' | '2years' = '1year'): Promise<{
    period: string;
    trends: {
      industryTrends: Array<{
        industry: string;
        growth: number;
        trend: 'up' | 'down' | 'stable';
      }>;
      amountTrends: Array<{
        month: string;
        avgInvestment: number;
        avgSubsidy: number;
        caseCount: number;
      }>;
      emergingPatterns: Array<{
        pattern: string;
        description: string;
        frequency: number;
        significance: 'high' | 'medium' | 'low';
      }>;
    };
  }> {
    const response = await api.get('/adopted-cases/analysis/trends', {
      params: { period }
    });
    return response.data;
  }

  /**
   * 検索・フィルタリング
   */
  async search(
    query: string,
    filters?: {
      industry?: string[];
      subsidyProgram?: string[];
      companySize?: string[];
      minAmount?: number;
      maxAmount?: number;
    }
  ): Promise<{
    results: AdoptedCase[];
    totalCount: number;
    facets: {
      industries: Record<string, number>;
      programs: Record<string, number>;
      companySizes: Record<string, number>;
    };
    suggestions: string[];
  }> {
    const response = await api.post('/adopted-cases/search', {
      query,
      filters
    });
    return response.data;
  }

  /**
   * 関連事例推薦
   */
  async getRecommendations(
    baseCase: {
      industry: string;
      companySize: string;
      projectType: string;
    },
    limit: number = 5
  ): Promise<Array<{
    case: AdoptedCase;
    relevanceScore: number;
    reasons: string[];
  }>> {
    const response = await api.post('/adopted-cases/recommendations', {
      baseCase,
      limit
    });
    return response.data;
  }

  /**
   * 事例の詳細分析
   */
  async getDetailedAnalysis(caseId: string): Promise<{
    case: AdoptedCase;
    analysis: {
      strengths: Array<{
        aspect: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
      }>;
      keyInsights: Array<{
        insight: string;
        evidence: string;
        applicability: string;
      }>;
      lessonsLearned: Array<{
        lesson: string;
        context: string;
        actionable: string;
      }>;
      riskFactors: Array<{
        risk: string;
        mitigation: string;
        probability: 'high' | 'medium' | 'low';
      }>;
    };
    similarCases: Array<{
      caseId: string;
      similarity: number;
      reason: string;
    }>;
  }> {
    const response = await api.get(`/adopted-cases/${caseId}/analysis`);
    return response.data;
  }
}

export const adoptedCasesApi = new AdoptedCasesApi();