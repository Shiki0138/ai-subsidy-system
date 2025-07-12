/**
 * Web情報分析サービス
 * Phase 3: ホームページ解析による企業情報自動抽出
 */

interface CompanyProfile {
  businessType: string
  mainServices: string[]
  targetMarket: string[]
  strengths: string[]
  recentNews: NewsItem[]
  financialHighlights: FinancialData
  technologyStack: string[]
  companySize: 'small' | 'medium' | 'large'
  establishedYear?: number
}

interface NewsItem {
  title: string
  date: string
  content: string
  relevance: number // 0-100
}

interface FinancialData {
  revenue?: string
  employees?: number
  growth?: string
  funding?: string[]
}

interface BusinessInsight {
  subsidyRecommendations: string[]
  strengthsForApplication: string[]
  suggestedApproaches: string[]
  competitiveAdvantages: string[]
  marketOpportunities: string[]
}

export class WebAnalysisService {

  /**
   * 企業ホームページを分析して詳細プロファイルを生成
   */
  async analyzeCompanyWebsite(url: string): Promise<CompanyProfile> {
    try {
      const response = await fetch('/api/company/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze website')
      }

      return await response.json()
    } catch (error) {
      console.error('Error analyzing website:', error)
      return this.getBasicProfile()
    }
  }

  /**
   * 法人番号APIと組み合わせた総合企業分析
   */
  async comprehensiveCompanyAnalysis(
    corporateNumber: string,
    websiteUrl?: string
  ): Promise<{
    profile: CompanyProfile
    insights: BusinessInsight
    confidence: number
  }> {
    try {
      const response = await fetch('/api/company/comprehensive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corporateNumber, websiteUrl })
      })

      return await response.json()
    } catch (error) {
      console.error('Error in comprehensive analysis:', error)
      return {
        profile: this.getBasicProfile(),
        insights: this.getBasicInsights(),
        confidence: 30
      }
    }
  }

  /**
   * 補助金申請に最適化された企業情報抽出
   */
  async extractSubsidyRelevantInfo(
    websiteUrl: string,
    subsidyType: string
  ): Promise<{
    relevantContent: string[]
    innovationAspects: string[]
    technicalCapabilities: string[]
    marketPosition: string[]
    collaborations: string[]
  }> {
    const response = await fetch('/api/company/subsidy-relevant-extraction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl, subsidyType })
    })

    return await response.json()
  }

  /**
   * 競合他社分析
   */
  async analyzeCompetitors(
    businessType: string,
    services: string[]
  ): Promise<{
    competitors: CompetitorInfo[]
    marketPosition: string
    differentiationOpportunities: string[]
  }> {
    const response = await fetch('/api/market/competitor-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessType, services })
    })

    return await response.json()
  }

  /**
   * 市場トレンド分析
   */
  async analyzeMarketTrends(
    industry: string,
    keywords: string[]
  ): Promise<{
    trends: MarketTrend[]
    opportunities: string[]
    threats: string[]
    recommendations: string[]
  }> {
    const response = await fetch('/api/market/trend-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, keywords })
    })

    return await response.json()
  }

  /**
   * 技術革新度評価
   */
  async evaluateInnovationLevel(
    companyProfile: CompanyProfile,
    industryContext: string
  ): Promise<{
    innovationScore: number // 0-100
    innovationAspects: string[]
    benchmarkComparison: string
    improvementSuggestions: string[]
  }> {
    const response = await fetch('/api/analysis/innovation-evaluation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyProfile, industryContext })
    })

    return await response.json()
  }

  /**
   * 補助金適合度スコアリング
   */
  async calculateSubsidyFitScore(
    companyProfile: CompanyProfile,
    subsidyType: string
  ): Promise<{
    overallScore: number
    categoryScores: {
      innovation: number
      feasibility: number
      marketPotential: number
      executionCapability: number
      policyAlignment: number
    }
    recommendations: string[]
    improvementAreas: string[]
  }> {
    const response = await fetch('/api/analysis/subsidy-fit-scoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyProfile, subsidyType })
    })

    return await response.json()
  }

  /**
   * リアルタイム情報更新
   */
  async updateCompanyInfo(
    corporateNumber: string,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    const response = await fetch('/api/company/update-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corporateNumber, forceRefresh })
    })

    const result = await response.json()
    return result.success
  }

  /**
   * 業界特化型分析
   */
  async industrySpecificAnalysis(
    companyProfile: CompanyProfile,
    industryType: string
  ): Promise<{
    industryInsights: string[]
    benchmarks: Record<string, number>
    opportunities: string[]
    bestPractices: string[]
  }> {
    const response = await fetch('/api/analysis/industry-specific', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyProfile, industryType })
    })

    return await response.json()
  }

  /**
   * 基本プロファイル（フォールバック）
   */
  private getBasicProfile(): CompanyProfile {
    return {
      businessType: '製造業',
      mainServices: ['製品開発', '製造'],
      targetMarket: ['国内B2B'],
      strengths: ['技術力', '品質'],
      recentNews: [],
      financialHighlights: {},
      technologyStack: [],
      companySize: 'small'
    }
  }

  /**
   * 基本インサイト（フォールバック）
   */
  private getBasicInsights(): BusinessInsight {
    return {
      subsidyRecommendations: ['ものづくり補助金', 'IT導入補助金'],
      strengthsForApplication: ['技術的な強み', '市場ニーズへの対応'],
      suggestedApproaches: ['革新性の強調', '具体的な数値目標'],
      competitiveAdvantages: ['技術の独自性', '品質の高さ'],
      marketOpportunities: ['デジタル化需要', '自動化ニーズ']
    }
  }
}

interface CompetitorInfo {
  name: string
  services: string[]
  strengths: string[]
  marketShare?: number
}

interface MarketTrend {
  trend: string
  impact: 'high' | 'medium' | 'low'
  timeframe: string
  relevance: number
}