import { api } from './base';

export interface AutoFillSuggestion {
  sectionId: string;
  sectionName: string;
  suggestedContent: string;
  confidence: number; // 0-100%の確信度
  sources: string[]; // データソース
  alternatives?: string[]; // 代替案
}

export interface WebsiteExtractionResult {
  extractedData: {
    companyName: string;
    businessDescription: string;
    services: string[];
    achievements: string[];
    companyHistory: string;
    employeeCount?: number;
    annualRevenue?: string;
    companyPhilosophy: string;
    contactInfo: {
      address?: string;
      phone?: string;
      email?: string;
    };
    socialMedia: {
      linkedin?: string;
      facebook?: string;
      twitter?: string;
    };
  };
  confidence: number;
  lastUpdated: Date;
  extractionMethod: 'puppeteer' | 'cheerio' | 'fallback';
  improvements: string[];
}

export interface SimilarCase {
  projectTitle: string;
  companyName: string;
  industry: string;
  keyPoints: string[];
  similarityScore: number;
  applicabilityReason: string;
}

class AutoFillApi {
  /**
   * 自動入力提案取得
   */
  async getSuggestions(
    subsidyGuidelineId: string,
    companyProfileId?: string
  ): Promise<{
    suggestions: AutoFillSuggestion[];
    similarCases: SimilarCase[];
    metadata: {
      generatedAt: Date;
      profileId: string;
      subsidyGuidelineId: string;
    };
  }> {
    const response = await api.post('/auto-fill/suggestions', {
      subsidyGuidelineId,
      companyProfileId
    });
    return response.data;
  }

  /**
   * Webサイトからの企業データ抽出
   */
  async extractWebsiteData(websiteUrl: string): Promise<{
    data: WebsiteExtractionResult;
  }> {
    const response = await api.post('/auto-fill/extract-website', {
      websiteUrl
    });
    return response.data;
  }

  /**
   * 抽出データの更新チェック
   */
  async checkForUpdates(): Promise<{
    needsUpdate: boolean;
    lastUpdated?: Date;
    changes?: string[];
    newData?: any;
    confidence?: number;
    message?: string;
  }> {
    const response = await api.get('/auto-fill/check-updates');
    return response.data;
  }

  /**
   * 学習機能実行
   */
  async learnFromHistory(): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.post('/auto-fill/learn-from-history');
    return response.data;
  }

  /**
   * セクション別AI生成
   */
  async generateSection(
    sectionType: string,
    context: any
  ): Promise<{
    generatedContent: string;
    confidence: number;
    alternatives: string[];
    sources: string[];
  }> {
    const response = await api.post('/auto-fill/generate-section', {
      sectionType,
      context
    });
    return response.data;
  }

  /**
   * 内容改善提案
   */
  async getImprovementSuggestions(
    content: string,
    sectionType: string
  ): Promise<{
    suggestions: Array<{
      type: 'grammar' | 'structure' | 'content' | 'format';
      issue: string;
      suggestion: string;
      example?: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    overallScore: number;
    improvedContent?: string;
  }> {
    const response = await api.post('/auto-fill/improve', {
      content,
      sectionType
    });
    return response.data;
  }

  /**
   * キーワード分析
   */
  async analyzeKeywords(
    content: string
  ): Promise<{
    keywords: Array<{
      word: string;
      frequency: number;
      importance: number;
      category: string;
    }>;
    suggestions: Array<{
      keyword: string;
      reason: string;
      impact: number;
    }>;
    density: number;
    readabilityScore: number;
  }> {
    const response = await api.post('/auto-fill/analyze-keywords', {
      content
    });
    return response.data;
  }

  /**
   * 同義語・関連語提案
   */
  async getSynonyms(
    word: string,
    context?: string
  ): Promise<{
    synonyms: string[];
    relatedTerms: string[];
    contextualSuggestions: Array<{
      term: string;
      explanation: string;
      example: string;
    }>;
  }> {
    const response = await api.post('/auto-fill/synonyms', {
      word,
      context
    });
    return response.data;
  }

  /**
   * 文章校正
   */
  async proofread(
    content: string,
    checkType: 'grammar' | 'style' | 'full' = 'full'
  ): Promise<{
    corrections: Array<{
      type: 'grammar' | 'spelling' | 'style' | 'suggestion';
      original: string;
      corrected: string;
      explanation: string;
      position: {
        start: number;
        end: number;
      };
    }>;
    correctedContent: string;
    score: number;
    statistics: {
      wordCount: number;
      sentenceCount: number;
      averageSentenceLength: number;
      readabilityLevel: string;
    };
  }> {
    const response = await api.post('/auto-fill/proofread', {
      content,
      checkType
    });
    return response.data;
  }

  /**
   * 文字数最適化
   */
  async optimizeLength(
    content: string,
    targetLength: number,
    operation: 'expand' | 'reduce' | 'adjust'
  ): Promise<{
    optimizedContent: string;
    originalLength: number;
    newLength: number;
    changes: Array<{
      type: 'added' | 'removed' | 'modified';
      text: string;
      reason: string;
    }>;
  }> {
    const response = await api.post('/auto-fill/optimize-length', {
      content,
      targetLength,
      operation
    });
    return response.data;
  }

  /**
   * テンプレート取得
   */
  async getTemplates(
    sectionType: string,
    industry?: string
  ): Promise<Array<{
    id: string;
    name: string;
    description: string;
    content: string;
    industry: string;
    category: string;
    usageCount: number;
    rating: number;
  }>> {
    const response = await api.get('/auto-fill/templates', {
      params: { sectionType, industry }
    });
    return response.data;
  }

  /**
   * AI使用状況統計
   */
  async getUsageStats(): Promise<{
    totalGenerations: number;
    totalTokensUsed: number;
    averageQuality: number;
    favoriteFeatures: Array<{
      feature: string;
      usageCount: number;
    }>;
    timeSeriesData: Array<{
      date: string;
      generations: number;
      tokensUsed: number;
    }>;
    costEstimate: {
      current: number;
      projected: number;
      currency: string;
    };
  }> {
    const response = await api.get('/auto-fill/stats');
    return response.data;
  }
}

export const autoFillApi = new AutoFillApi();